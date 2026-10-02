# Durgotsav Event Management Backend API

A production-ready Node.js, Express.js, and MongoDB backend application designed for managing Durgotsav events, participant registrations, performance tracking, certificate issuance, and admin operations.

---

## 🏛️ Architecture & Separation of Concerns

```
EventManagement/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler with graceful error fallback
│   ├── controllers/
│   │   ├── authController.js       # Phone login & profile endpoints
│   │   ├── activityController.js   # Public activity listings & details
│   │   ├── participantController.js# User registrations, withdraw, and history
│   │   └── adminController.js      # Admin CRUD, status updates, dashboard, and users
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT validation & user attachment from UserDirectory
│   │   ├── adminMiddleware.js      # Strict database-level admin authorization (UserDirectory.isAdmin === true)
│   │   └── errorMiddleware.js      # Centralized error handler & 404 router
│   ├── models/
│   │   ├── UserDirectory.js        # User model (Phone indexed, no password/OTP, isAdmin)
│   │   ├── Activity.js             # Activity model (with soft delete, timestamps, validators)
│   │   └── Participant.js          # Participant model (with audit tracking & display snapshots)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── activityRoutes.js       # /api/activities
│   │   ├── participantRoutes.js    # /api/participants
│   │   └── adminRoutes.js          # /api/admin
│   ├── services/
│   │   ├── authService.js          # Business logic for authentication & tokens
│   │   ├── activityService.js      # Business logic for activities
│   │   ├── participantService.js   # Business logic for registrations & withdrawals
│   │   └── adminService.js         # Business logic for admin workflows & dashboard
│   ├── utils/
│   │   ├── jwt.js                  # JWT sign & verify helpers
│   │   └── response.js             # Standardized API response utilities
│   └── server.js                   # Application entry point
├── .env                            # Environment configurations
├── package.json
└── README.md
```

---

## 🔑 Authentication & Authorization Model

- **No Passwords / No OTPs**: Authentication relies on phone number verification against the `UserDirectory` collection.
- **Admin Authorization**: Verified against the database record (`UserDirectory.isAdmin === true`). Never trusted from request body or client input.
- **JWT Sessions**: On successful login with a registered phone number, a signed JWT Bearer token is issued for subsequent requests.

---

## 📋 Database Collections

### 1. `UserDirectory`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `fullName` | String (Required) | User's full name |
| `phone` | String (Required, Unique, Indexed) | Mobile number (stored as String) |
| `society` | String | Society / Apartment name |
| `tower` | String | Tower / Block |
| `floor` | String | Floor number |
| `flatNumber` | String | Flat / Unit number |
| `isAdmin` | Boolean (Default: false) | Admin privileges flag |
| `createdOn` | Date (Automatic) | Record creation timestamp |
| `modifiedOn` | Date (Automatic) | Last update timestamp |

### 2. `Activity`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `activity` | String (Required) | Activity name |
| `description` | String | Detailed description |
| `venue` | String (Required) | Event venue / location |
| `startDateTime` | Date (Required) | Event start timestamp |
| `endDateTime` | Date (Required) | Event end timestamp (>= startDateTime) |
| `audioVideoLink` | String | Media URL link |
| `isActive` | Boolean (Default: true) | Activity active status |
| `isDeleted` | Boolean (Default: false) | Soft delete flag |
| `modifiedBy` | ObjectId (Ref: UserDirectory) | User ID who modified record |
| `createdOn` | Date (Automatic) | Creation timestamp |
| `modifiedOn` | Date (Automatic) | Modification timestamp |

### 3. `Participant`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `activityId` | ObjectId (Ref: Activity) | Associated activity ID |
| `activity` | String | Snapshot of activity name |
| `userId` | ObjectId (Ref: UserDirectory) | Registered user ID |
| `fullName` | String (Copied from UserDirectory) | Participant's name |
| `mobile` | String (Copied from UserDirectory) | Mobile number |
| `email` | String (Optional) | Contact email |
| `society`, `tower`, `floor`, `flatNo` | String | Address fields copied from UserDirectory |
| `isWithdraw` | Boolean (Default: false) | Registration withdrawal status |
| `isPerformed` | Boolean (Default: false) | Marked only by Admin |
| `isCertificateCollected` | Boolean (Default: false) | Marked only by Admin after performance |
| `performedMarkedBy` | ObjectId (Ref: UserDirectory) | Admin who marked performance |
| `performedDate` | Date | Timestamp of performance marking |
| `certificateCollectedDate` | Date | Timestamp of certificate collection |
| `createdDate` | Date (Automatic) | Registration timestamp |
| `modifiedDate` | Date (Automatic) | Last modification timestamp |
| `modifiedBy` | ObjectId (Ref: UserDirectory) | Last modified by user/admin |

---

## 🚀 API Endpoints Reference

### 1. Authentication
- `POST /api/auth/login`
  - **Body**: `{ "phone": "9876543210" }`
  - **Response**: `{ "success": true, "token": "...", "user": { ... } }`
- `GET /api/auth/me` *(Requires Auth Token)*
  - **Response**: Profile of currently authenticated user.

### 2. User Activities
- `GET /api/activities`
  - Returns all active and non-deleted activities (`isActive=true`, `isDeleted=false`).
- `GET /api/activities/:id`
  - Returns detailed activity information.

### 3. Participant Operations *(Requires Auth Token)*
- `POST /api/participants`
  - **Body**: `{ "activityId": "...", "email": "optional@example.com" }`
  - *User data is securely fetched and populated directly from `UserDirectory`.*
- `GET /api/participants/my`
  - Returns all registrations for the logged-in user with activity details.
- `PUT /api/participants/:id/withdraw`
  - Allows user to withdraw from an activity (if not already performed).

### 4. Admin Operations *(Requires Auth Token & Admin Role)*

#### Activity Management
- `POST /api/admin/activities` — Create new activity.
- `GET /api/admin/activities` — List all activities (with filters: `search`, `isActive`, `includeDeleted`).
- `PUT /api/admin/activities/:id` — Update activity details.
- `DELETE /api/admin/activities/:id` — Soft delete activity (`isDeleted: true, isActive: false`).

#### Participant Tracking & Audit
- `GET /api/admin/activities/:activityId/participants` — View participants with filters:
  - Query params:
    - `status`: `all`, `performed`, `not_performed`, `withdrawn`, `certificate_collected`, `certificate_pending`
    - `search`: Search by participant name, phone, flat number, society, or tower.
- `PUT /api/admin/participants/:id/mark-performed` — Mark participant as performed.
- `PUT /api/admin/participants/:id/mark-certificate-collected` — Mark certificate as collected (requires `isPerformed: true`).

#### Dashboard Metrics
- `GET /api/admin/dashboard` — Summary analytics:
  ```json
  {
    "success": true,
    "totalActivities": 10,
    "activeActivities": 8,
    "totalParticipants": 250,
    "totalPerformed": 210,
    "totalWithdrawn": 15,
    "totalCertificatesCollected": 180,
    "pendingCertificates": 30,
    "activityStats": [ ... ]
  }
  ```

#### User Directory Management
- `GET /api/admin/users` — List and search registered users.
- `POST /api/admin/users` — Add a new user to `UserDirectory` (set `isAdmin: true` for admin).
- `PUT /api/admin/users/:id` — Update user details or toggle admin role.

---

## 🛠️ Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
```

---

## ⚙️ Running Locally

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start
```
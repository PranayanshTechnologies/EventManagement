const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

// All admin routes require authentication and admin authorization
router.use(authenticate, requireAdmin);

// ==================== DASHBOARD ====================
router.get("/dashboard", adminController.getDashboard);

// ==================== ACTIVITIES ====================
router.post("/activities", adminController.createActivity);
router.get("/activities", adminController.getAllActivities);
router.put("/activities/:id", adminController.updateActivity);
router.delete("/activities/:id", adminController.deleteActivity);

// ==================== PARTICIPANTS ====================
router.get("/activities/:activityId/participants", adminController.getActivityParticipants);
router.put("/participants/:id/mark-performed", adminController.markPerformed);
router.put("/participants/:id/mark-certificate-collected", adminController.markCertificateCollected);

// ==================== USER DIRECTORY ====================
router.get("/users", adminController.getAllUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);

module.exports = router;

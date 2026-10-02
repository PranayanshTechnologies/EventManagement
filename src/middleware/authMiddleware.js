const { verifyToken } = require("../utils/jwt");
const UserDirectory = require("../models/UserDirectory");
const { errorResponse } = require("../utils/response");

/**
 * Authentication Middleware
 * Validates JWT token from Bearer header and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return errorResponse(res, "Access denied. No token provided or invalid format.", 401);
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return errorResponse(res, "Access denied. Token missing.", 401);
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (jwtErr) {
            if (jwtErr.name === "TokenExpiredError") {
                return errorResponse(res, "Token has expired. Please log in again.", 401);
            }
            return errorResponse(res, "Invalid authentication token.", 401);
        }

        // Verify user exists in UserDirectory
        const user = await UserDirectory.findById(decoded.id);
        if (!user) {
            return errorResponse(res, "User not found or no longer active.", 401);
        }

        // Attach user info to req.user
        req.user = {
            id: user._id.toString(),
            _id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            society: user.society,
            tower: user.tower,
            floor: user.floor,
            flatNumber: user.flatNumber,
            isAdmin: Boolean(user.isAdmin)
        };

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return errorResponse(res, "Authentication failed.", 500);
    }
};

module.exports = authenticate;

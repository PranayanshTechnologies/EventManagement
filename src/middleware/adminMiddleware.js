const UserDirectory = require("../models/UserDirectory");
const { errorResponse } = require("../utils/response");

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user has isAdmin: true in UserDirectory
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return errorResponse(res, "Authentication required.", 401);
        }

        // Direct database verification to ensure UserDirectory is the source of truth
        const user = await UserDirectory.findById(req.user.id);

        if (!user || user.isAdmin !== true) {
            return errorResponse(res, "Access denied. Admin privileges required.", 403);
        }

        // Keep req.user in sync with latest DB admin status
        req.user.isAdmin = true;

        next();
    } catch (error) {
        console.error("Admin Middleware Error:", error);
        return errorResponse(res, "Authorization check failed.", 500);
    }
};

module.exports = requireAdmin;

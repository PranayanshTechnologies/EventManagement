const authService = require("../services/authService");
const { successResponse } = require("../utils/response");

/**
 * Handle user mobile login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const result = await authService.login(phone);

        return successResponse(res, "Login successful", {
            token: result.token,
            user: result.user
        }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Get current logged-in user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await authService.getUserProfile(req.user.id);
        return successResponse(res, "User profile fetched successfully", { user }, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    getProfile
};

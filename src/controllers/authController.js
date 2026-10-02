const authService = require("../services/authService");
const { successResponse } = require("../utils/response");

/**
 * Handle user mobile login / phone lookup
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const result = await authService.login(phone);

        if (result.isNewUser) {
            return successResponse(
                res,
                result.message || "New mobile number. Please complete registration.",
                {
                    isNewUser: true,
                    phone: result.phone
                },
                200
            );
        }

        return successResponse(
            res,
            "Login successful",
            {
                isNewUser: false,
                token: result.token,
                user: result.user
            },
            200
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Handle new user registration
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);

        return successResponse(
            res,
            "Registration successful",
            {
                isNewUser: false,
                token: result.token,
                user: result.user
            },
            201
        );
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
    register,
    getProfile
};

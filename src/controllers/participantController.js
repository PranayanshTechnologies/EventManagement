const participantService = require("../services/participantService");
const { successResponse } = require("../utils/response");

/**
 * Register current user for an activity
 * POST /api/participants
 */
const registerForActivity = async (req, res, next) => {
    try {
        const participant = await participantService.registerParticipant(req.user.id, req.body);
        return successResponse(res, "Registered successfully for activity", { participant }, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's registrations
 * GET /api/participants/my
 */
const getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await participantService.getMyRegistrations(req.user.id);
        return successResponse(res, "User registrations retrieved successfully", {
            count: registrations.length,
            registrations
        }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Withdraw current user's registration
 * PUT /api/participants/:id/withdraw
 */
const withdrawRegistration = async (req, res, next) => {
    try {
        const participant = await participantService.withdrawRegistration(req.params.id, req.user.id, req.user.isAdmin);
        return successResponse(res, "Registration withdrawn successfully", { participant }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Revoke withdrawal of current user's registration
 * PUT /api/participants/:id/revoke-withdraw
 */
const revokeWithdrawRegistration = async (req, res, next) => {
    try {
        const participant = await participantService.revokeWithdrawRegistration(req.params.id, req.user.id, req.user.isAdmin);
        return successResponse(res, "Registration reactivated successfully", { participant }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user's registration details
 * PUT /api/participants/:id
 */
const updateParticipant = async (req, res, next) => {
    try {
        const participant = await participantService.updateParticipant(req.params.id, req.user.id, req.body, req.user.isAdmin);
        return successResponse(res, "Registration updated successfully", { participant }, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerForActivity,
    getMyRegistrations,
    withdrawRegistration,
    revokeWithdrawRegistration,
    updateParticipant
};

const activityService = require("../services/activityService");
const participantService = require("../services/participantService");
const { successResponse } = require("../utils/response");

/**
 * Get all active and non-deleted activities
 * GET /api/activities
 */
const getActivities = async (req, res, next) => {
    try {
        const activities = await activityService.getActiveActivities();
        return successResponse(res, "Activities retrieved successfully", {
            count: activities.length,
            activities
        }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Get single active activity by ID
 * GET /api/activities/:id
 */
const getActivityById = async (req, res, next) => {
    try {
        const activity = await activityService.getActivityById(req.params.id);
        return successResponse(res, "Activity retrieved successfully", { activity }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Get active participants list for an activity
 * GET /api/activities/:id/participants
 */
const getActivityParticipants = async (req, res, next) => {
    try {
        const participants = await participantService.getPublicActivityParticipants(req.params.id, req.query);
        return successResponse(res, "Participants retrieved successfully", {
            count: participants.length,
            participants
        }, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getActivities,
    getActivityById,
    getActivityParticipants
};

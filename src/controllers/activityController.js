const activityService = require("../services/activityService");
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

module.exports = {
    getActivities,
    getActivityById
};

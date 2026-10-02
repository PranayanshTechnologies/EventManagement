const activityService = require("../services/activityService");
const adminService = require("../services/adminService");
const { successResponse } = require("../utils/response");

// ==================== ACTIVITY CONTROLLERS ====================

/**
 * Admin creates new activity
 * POST /api/admin/activities
 */
const createActivity = async (req, res, next) => {
    try {
        const activity = await activityService.createActivity(req.body, req.user.id);
        return successResponse(res, "Activity created successfully", { activity }, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin updates activity
 * PUT /api/admin/activities/:id
 */
const updateActivity = async (req, res, next) => {
    try {
        const activity = await activityService.updateActivity(req.params.id, req.body, req.user.id);
        return successResponse(res, "Activity updated successfully", { activity }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin soft deletes activity
 * DELETE /api/admin/activities/:id
 */
const deleteActivity = async (req, res, next) => {
    try {
        const activity = await activityService.deleteActivity(req.params.id, req.user.id);
        return successResponse(res, "Activity deleted successfully", { activity }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin lists all activities with filters
 * GET /api/admin/activities
 */
const getAllActivities = async (req, res, next) => {
    try {
        const activities = await activityService.getAllActivitiesForAdmin(req.query);
        return successResponse(res, "Activities retrieved successfully", {
            count: activities.length,
            activities
        }, 200);
    } catch (error) {
        next(error);
    }
};

// ==================== PARTICIPANT CONTROLLERS ====================

/**
 * Admin views participants of an activity with filtering/search
 * GET /api/admin/activities/:activityId/participants
 */
const getActivityParticipants = async (req, res, next) => {
    try {
        const result = await adminService.getActivityParticipants(req.params.activityId, req.query);
        return successResponse(res, "Participants retrieved successfully", result, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin marks participant as performed
 * PUT /api/admin/participants/:id/mark-performed
 */
const markPerformed = async (req, res, next) => {
    try {
        const participant = await adminService.markPerformed(req.params.id, req.user.id);
        return successResponse(res, "Participant marked as performed successfully", { participant }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin marks certificate as collected
 * PUT /api/admin/participants/:id/mark-certificate-collected
 */
const markCertificateCollected = async (req, res, next) => {
    try {
        const participant = await adminService.markCertificateCollected(req.params.id, req.user.id);
        return successResponse(res, "Certificate marked as collected successfully", { participant }, 200);
    } catch (error) {
        next(error);
    }
};

// ==================== DASHBOARD CONTROLLERS ====================

/**
 * Admin dashboard statistics
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        return successResponse(res, "Dashboard statistics retrieved successfully", stats, 200);
    } catch (error) {
        next(error);
    }
};

// ==================== USER DIRECTORY MANAGEMENT CONTROLLERS ====================

/**
 * Admin lists users in UserDirectory
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
    try {
        const users = await adminService.getAllUsers(req.query);
        return successResponse(res, "Users retrieved successfully", {
            count: users.length,
            users
        }, 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin creates user in UserDirectory
 * POST /api/admin/users
 */
const createUser = async (req, res, next) => {
    try {
        const user = await adminService.createUser(req.body);
        return successResponse(res, "User created successfully in UserDirectory", { user }, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Admin updates user in UserDirectory (e.g. promoting to admin)
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
    try {
        const user = await adminService.updateUser(req.params.id, req.body);
        return successResponse(res, "User updated successfully", { user }, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createActivity,
    updateActivity,
    deleteActivity,
    getAllActivities,
    getActivityParticipants,
    markPerformed,
    markCertificateCollected,
    getDashboard,
    getAllUsers,
    createUser,
    updateUser
};

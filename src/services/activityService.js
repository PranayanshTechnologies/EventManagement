const Activity = require("../models/Activity");

/**
 * Get all active and non-deleted activities for normal users
 */
const getActiveActivities = async () => {
    return await Activity.find({
        isActive: true,
        isDeleted: false
    }).sort({ startDateTime: 1 });
};

/**
 * Get a single active activity by ID
 * @param {String} activityId
 */
const getActivityById = async (activityId) => {
    const activity = await Activity.findOne({
        _id: activityId,
        isActive: true,
        isDeleted: false
    });

    if (!activity) {
        const error = new Error("Activity not found or is currently inactive");
        error.statusCode = 404;
        throw error;
    }

    return activity;
};

/**
 * Create a new activity (Admin Only)
 * @param {Object} data
 * @param {String} adminId
 */
const createActivity = async (data, adminId) => {
    const { activity, description, venue, startDateTime, endDateTime, audioVideoLink } = data;

    if (!activity || !venue || !startDateTime || !endDateTime) {
        const error = new Error("Activity name, venue, start date/time, and end date/time are required.");
        error.statusCode = 400;
        throw error;
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        const error = new Error("Invalid startDateTime or endDateTime format.");
        error.statusCode = 400;
        throw error;
    }

    if (endDate < startDate) {
        const error = new Error("End date and time cannot be earlier than start date and time.");
        error.statusCode = 400;
        throw error;
    }

    const newActivity = new Activity({
        activity: activity.trim(),
        description: description ? description.trim() : "",
        venue: venue.trim(),
        startDateTime: startDate,
        endDateTime: endDate,
        audioVideoLink: audioVideoLink ? audioVideoLink.trim() : "",
        modifiedBy: adminId,
        isActive: true,
        isDeleted: false
    });

    return await newActivity.save();
};

/**
 * Update an existing activity (Admin Only)
 * @param {String} activityId
 * @param {Object} data
 * @param {String} adminId
 */
const updateActivity = async (activityId, data, adminId) => {
    const existingActivity = await Activity.findById(activityId);

    if (!existingActivity || existingActivity.isDeleted) {
        const error = new Error("Activity not found");
        error.statusCode = 404;
        throw error;
    }

    const { activity, description, venue, startDateTime, endDateTime, audioVideoLink, isActive } = data;

    if (activity !== undefined) existingActivity.activity = activity.trim();
    if (description !== undefined) existingActivity.description = description ? description.trim() : "";
    if (venue !== undefined) existingActivity.venue = venue.trim();
    if (audioVideoLink !== undefined) existingActivity.audioVideoLink = audioVideoLink ? audioVideoLink.trim() : "";
    if (isActive !== undefined) existingActivity.isActive = Boolean(isActive);

    if (startDateTime !== undefined) {
        const startDate = new Date(startDateTime);
        if (isNaN(startDate.getTime())) {
            const error = new Error("Invalid startDateTime format.");
            error.statusCode = 400;
            throw error;
        }
        existingActivity.startDateTime = startDate;
    }

    if (endDateTime !== undefined) {
        const endDate = new Date(endDateTime);
        if (isNaN(endDate.getTime())) {
            const error = new Error("Invalid endDateTime format.");
            error.statusCode = 400;
            throw error;
        }
        existingActivity.endDateTime = endDate;
    }

    // Validate end date not before start date
    if (new Date(existingActivity.endDateTime) < new Date(existingActivity.startDateTime)) {
        const error = new Error("End date and time cannot be earlier than start date and time.");
        error.statusCode = 400;
        throw error;
    }

    existingActivity.modifiedBy = adminId;
    return await existingActivity.save();
};

/**
 * Soft delete an activity (Admin Only)
 * @param {String} activityId
 * @param {String} adminId
 */
const deleteActivity = async (activityId, adminId) => {
    const activity = await Activity.findById(activityId);

    if (!activity || activity.isDeleted) {
        const error = new Error("Activity not found or already deleted");
        error.statusCode = 404;
        throw error;
    }

    activity.isDeleted = true;
    activity.isActive = false;
    activity.modifiedBy = adminId;

    return await activity.save();
};

/**
 * List all activities for admin (including inactive and deleted with filter options)
 * @param {Object} query
 */
const getAllActivitiesForAdmin = async (query = {}) => {
    const filter = {};

    if (query.includeDeleted !== "true") {
        filter.isDeleted = false;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    if (query.search) {
        filter.activity = { $regex: query.search, $options: "i" };
    }

    return await Activity.find(filter)
        .populate("modifiedBy", "fullName phone")
        .sort({ startDateTime: 1 });
};

module.exports = {
    getActiveActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    getAllActivitiesForAdmin
};

const Participant = require("../models/Participant");
const Activity = require("../models/Activity");
const UserDirectory = require("../models/UserDirectory");

/**
 * Register user for an activity
 * Note: fullName, mobile, society, tower, floor, flatNo are copied from UserDirectory
 * @param {String} userId
 * @param {Object} data { activityId, email }
 */
const registerParticipant = async (userId, data) => {
    const { activityId, email } = data;

    if (!activityId) {
        const error = new Error("Activity ID is required");
        error.statusCode = 400;
        throw error;
    }

    // 1. Fetch user from UserDirectory (source of truth)
    const user = await UserDirectory.findById(userId);
    if (!user) {
        const error = new Error("User record not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Fetch Activity and ensure it is active and not deleted
    const activity = await Activity.findOne({
        _id: activityId,
        isActive: true,
        isDeleted: false
    });

    if (!activity) {
        const error = new Error("Activity is not available for registration or does not exist");
        error.statusCode = 404;
        throw error;
    }

    // 3. Check if user already has an active registration for this activity
    const existingRegistration = await Participant.findOne({
        activityId: activity._id,
        userId: user._id,
        isWithdraw: false
    });

    if (existingRegistration) {
        const error = new Error("You are already registered for this activity");
        error.statusCode = 400;
        throw error;
    }

    // 4. Create new Participant snapshot record
    const participant = new Participant({
        activityId: activity._id,
        activity: activity.activity,
        userId: user._id,
        fullName: user.fullName,
        mobile: user.phone,
        email: email ? email.trim() : "",
        society: user.society || "",
        tower: user.tower || "",
        floor: user.floor || "",
        flatNo: user.flatNumber || "",
        modifiedBy: user._id,
        isWithdraw: false,
        isPerformed: false,
        isCertificateCollected: false,
        performedMarkedBy: null,
        performedDate: null,
        certificateCollectedDate: null
    });

    return await participant.save();
};

/**
 * Get all registrations belonging to the logged-in user
 * @param {String} userId
 */
const getMyRegistrations = async (userId) => {
    return await Participant.find({ userId })
        .populate({
            path: "activityId",
            select: "activity description venue startDateTime endDateTime audioVideoLink isActive isDeleted"
        })
        .sort({ createdDate: -1 });
};

/**
 * Normal user withdraws their own registration
 * @param {String} participantId
 * @param {String} userId
 */
const withdrawRegistration = async (participantId, userId) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Registration not found");
        error.statusCode = 404;
        throw error;
    }

    // Ensure the registration belongs to the requesting user
    if (participant.userId.toString() !== userId.toString()) {
        const error = new Error("Unauthorized to withdraw this registration");
        error.statusCode = 403;
        throw error;
    }

    if (participant.isWithdraw) {
        const error = new Error("Registration is already withdrawn");
        error.statusCode = 400;
        throw error;
    }

    if (participant.isPerformed) {
        const error = new Error("Cannot withdraw from an activity that has already been performed");
        error.statusCode = 400;
        throw error;
    }

    participant.isWithdraw = true;
    participant.modifiedBy = userId;

    return await participant.save();
};

module.exports = {
    registerParticipant,
    getMyRegistrations,
    withdrawRegistration
};

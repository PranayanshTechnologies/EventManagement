const Participant = require("../models/Participant");
const Activity = require("../models/Activity");
const UserDirectory = require("../models/UserDirectory");

/**
 * Get participants for a specific activity with filtering and search
 * @param {String} activityId
 * @param {Object} query
 */
const getActivityParticipants = async (activityId, query = {}) => {
    // Verify activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
        const error = new Error("Activity not found");
        error.statusCode = 404;
        throw error;
    }

    const filter = { activityId };

    // Status filtering
    const status = query.status ? query.status.toLowerCase().trim() : "all";

    if (status === "performed") {
        filter.isPerformed = true;
    } else if (status === "not_performed" || status === "not performed") {
        filter.isPerformed = false;
        filter.isWithdraw = false;
    } else if (status === "withdrawn") {
        filter.isWithdraw = true;
    } else if (status === "certificate_collected" || status === "certificate collected") {
        filter.isCertificateCollected = true;
    } else if (status === "certificate_pending" || status === "certificate pending") {
        filter.isPerformed = true;
        filter.isCertificateCollected = false;
    }

    // Search query by fullName, mobile, flatNo, society, tower
    if (query.search) {
        const searchRegex = { $regex: query.search.trim(), $options: "i" };
        filter.$or = [
            { fullName: searchRegex },
            { mobile: searchRegex },
            { flatNo: searchRegex },
            { society: searchRegex },
            { tower: searchRegex }
        ];
    }

    const participants = await Participant.find(filter)
        .populate("performedMarkedBy", "fullName phone")
        .populate("modifiedBy", "fullName phone")
        .sort({ isWithdraw: 1, participantNumber: 1 });

    return {
        activity: {
            id: activity._id,
            name: activity.activity,
            venue: activity.venue,
            startDateTime: activity.startDateTime,
            endDateTime: activity.endDateTime
        },
        totalCount: participants.length,
        participants
    };
};

/**
 * Admin marks participant as performed
 * @param {String} participantId
 * @param {String} adminId
 */
const markPerformed = async (participantId, adminId) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Participant record not found");
        error.statusCode = 404;
        throw error;
    }

    if (participant.isWithdraw) {
        const error = new Error("Cannot mark as performed: Participant has withdrawn from this activity.");
        error.statusCode = 400;
        throw error;
    }

    if (participant.isPerformed) {
        const error = new Error("Participant has already been marked as performed.");
        error.statusCode = 400;
        throw error;
    }

    const now = new Date();
    participant.isPerformed = true;
    participant.performedMarkedBy = adminId;
    participant.performedDate = now;
    participant.modifiedBy = adminId;

    return await participant.save();
};

/**
 * Admin marks certificate as collected
 * Requires participant to have performed first
 * @param {String} participantId
 * @param {String} adminId
 */
const markCertificateCollected = async (participantId, adminId) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Participant record not found");
        error.statusCode = 404;
        throw error;
    }

    if (participant.isWithdraw) {
        const error = new Error("Cannot mark certificate: Participant has withdrawn.");
        error.statusCode = 400;
        throw error;
    }

    if (!participant.isPerformed) {
        const error = new Error("Cannot mark certificate collected: Participant has not yet performed.");
        error.statusCode = 400;
        throw error;
    }

    if (participant.isCertificateCollected) {
        const error = new Error("Certificate has already been marked as collected.");
        error.statusCode = 400;
        throw error;
    }

    const now = new Date();
    participant.isCertificateCollected = true;
    participant.certificateCollectedDate = now;
    participant.modifiedBy = adminId;

    return await participant.save();
};

/**
 * Get comprehensive Admin Dashboard statistics
 */
const getDashboardStats = async () => {
    const totalActivities = await Activity.countDocuments({ isDeleted: false });
    const activeActivities = await Activity.countDocuments({ isActive: true, isDeleted: false });

    const totalParticipants = await Participant.countDocuments({});
    const totalPerformed = await Participant.countDocuments({ isPerformed: true });
    const totalWithdrawn = await Participant.countDocuments({ isWithdraw: true });
    const totalCertificatesCollected = await Participant.countDocuments({ isCertificateCollected: true });
    const pendingCertificates = await Participant.countDocuments({
        isPerformed: true,
        isCertificateCollected: false
    });

    // Activity-wise statistics aggregation
    const activities = await Activity.find({ isDeleted: false }).sort({ startDateTime: 1 });

    const activityStats = await Promise.all(
        activities.map(async (act) => {
            const totalReg = await Participant.countDocuments({ activityId: act._id });
            const performedCount = await Participant.countDocuments({ activityId: act._id, isPerformed: true });
            const withdrawnCount = await Participant.countDocuments({ activityId: act._id, isWithdraw: true });
            const certCollectedCount = await Participant.countDocuments({
                activityId: act._id,
                isCertificateCollected: true
            });
            const pendingCertCount = await Participant.countDocuments({
                activityId: act._id,
                isPerformed: true,
                isCertificateCollected: false
            });

            return {
                activityId: act._id,
                activityName: act.activity,
                venue: act.venue,
                startDateTime: act.startDateTime,
                endDateTime: act.endDateTime,
                isActive: act.isActive,
                totalRegistered: totalReg,
                activeRegistrations: totalReg - withdrawnCount,
                performed: performedCount,
                withdrawn: withdrawnCount,
                certificatesCollected: certCollectedCount,
                pendingCertificates: pendingCertCount
            };
        })
    );

    return {
        totalActivities,
        activeActivities,
        totalParticipants,
        totalPerformed,
        totalWithdrawn,
        totalCertificatesCollected,
        pendingCertificates,
        activityStats
    };
};

/**
 * UserDirectory Management (Admin Only)
 */
const getAllUsers = async (query = {}) => {
    const filter = {};
    if (query.search) {
        const searchRegex = { $regex: query.search.trim(), $options: "i" };
        filter.$or = [
            { fullName: searchRegex },
            { phone: searchRegex },
            { flatNumber: searchRegex },
            { society: searchRegex }
        ];
    }
    if (query.isAdmin !== undefined) {
        filter.isAdmin = query.isAdmin === "true";
    }

    return await UserDirectory.find(filter).sort({ createdOn: -1 });
};

const createUser = async (userData) => {
    const { fullName, phone, society, tower, floor, flatNumber, isAdmin } = userData;

    if (!fullName || !phone) {
        const error = new Error("Full name and phone are required");
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await UserDirectory.findOne({ phone: phone.trim() });
    if (existingUser) {
        const error = new Error(`User with phone number ${phone.trim()} already exists`);
        error.statusCode = 400;
        throw error;
    }

    const newUser = new UserDirectory({
        fullName: fullName.trim(),
        phone: phone.trim(),
        society: society ? society.trim() : "",
        tower: tower ? tower.trim() : "",
        floor: floor ? floor.trim() : "",
        flatNumber: flatNumber ? flatNumber.trim() : "",
        isAdmin: Boolean(isAdmin)
    });

    return await newUser.save();
};

const updateUser = async (userId, userData) => {
    const user = await UserDirectory.findById(userId);
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const { fullName, phone, society, tower, floor, flatNumber, isAdmin } = userData;

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (society !== undefined) user.society = society ? society.trim() : "";
    if (tower !== undefined) user.tower = tower ? tower.trim() : "";
    if (floor !== undefined) user.floor = floor ? floor.trim() : "";
    if (flatNumber !== undefined) user.flatNumber = flatNumber ? flatNumber.trim() : "";
    if (isAdmin !== undefined) user.isAdmin = Boolean(isAdmin);

    return await user.save();
};

module.exports = {
    getActivityParticipants,
    markPerformed,
    markCertificateCollected,
    getDashboardStats,
    getAllUsers,
    createUser,
    updateUser
};

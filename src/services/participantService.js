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
    const { activityId, email, audioVideoLink, fullName, mobile, phone, society, tower, floor, flatNo, flatNumber } = data;

    if (!activityId) {
        const error = new Error("Activity ID is required");
        error.statusCode = 400;
        throw error;
    }

    // Validate optional audioVideoLink if provided
    let cleanMediaLink = "";
    if (audioVideoLink && typeof audioVideoLink === "string" && audioVideoLink.trim() !== "") {
        const trimmed = audioVideoLink.trim();
        try {
            const parsed = new URL(trimmed);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                throw new Error();
            }
            cleanMediaLink = trimmed;
        } catch {
            const error = new Error("Please enter a valid Audio / Video URL (e.g. https://...)");
            error.statusCode = 400;
            throw error;
        }
    }

    // 1. Fetch user from UserDirectory (source of truth for registering user)
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

    // Determine participant details (allows registering family members e.g. wife, child, self)
    const participantName = fullName && typeof fullName === "string" && fullName.trim() ? fullName.trim() : user.fullName;
    const participantPhone = mobile && typeof mobile === "string" && mobile.trim() ? mobile.trim() : (phone && typeof phone === "string" && phone.trim() ? phone.trim() : user.phone);
    const participantEmail = email && typeof email === "string" && email.trim() ? email.trim() : (user.email || "");
    const participantSociety = society && typeof society === "string" && society.trim() ? society.trim() : (user.society || "");
    const participantTower = tower && typeof tower === "string" && tower.trim() ? tower.trim() : (user.tower || "");
    const participantFloor = floor !== undefined && floor !== null ? String(floor).trim() : (user.floor || "");
    const participantFlat = flatNo && typeof flatNo === "string" && flatNo.trim() ? flatNo.trim() : (flatNumber && typeof flatNumber === "string" && flatNumber.trim() ? flatNumber.trim() : (user.flatNumber || ""));

    // 3. Check if exact same participant name is already actively registered for this activity under this user
    const existingRegistration = await Participant.findOne({
        activityId: activity._id,
        userId: user._id,
        fullName: { $regex: new RegExp(`^${participantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
        isWithdraw: false
    });

    if (existingRegistration) {
        const error = new Error(`Participant "${participantName}" is already registered for this activity.`);
        error.statusCode = 400;
        throw error;
    }

    // 4. Calculate next participantNumber for this activity (isolated per activity, permanent queue)
    // Retry loop in case of race condition collision on compound index (activityId + participantNumber)
    let savedParticipant = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!savedParticipant && attempts < maxAttempts) {
        attempts++;
        const lastParticipant = await Participant.findOne({ activityId: activity._id })
            .sort({ participantNumber: -1 })
            .select("participantNumber");

        const nextParticipantNumber =
            lastParticipant && typeof lastParticipant.participantNumber === "number"
                ? lastParticipant.participantNumber + 1
                : 1;

        const participant = new Participant({
            participantNumber: nextParticipantNumber,
            activityId: activity._id,
            activity: activity.activity,
            userId: user._id,
            fullName: participantName,
            mobile: participantPhone,
            email: participantEmail,
            society: participantSociety,
            tower: participantTower,
            floor: participantFloor,
            flatNo: participantFlat,
            audioVideoLink: cleanMediaLink,
            modifiedBy: user._id,
            isWithdraw: false,
            isPerformed: false,
            isCertificateCollected: false,
            performedMarkedBy: null,
            performedDate: null,
            certificateCollectedDate: null
        });

        try {
            savedParticipant = await participant.save();
        } catch (err) {
            // If duplicate key error on activityId + participantNumber, retry to fetch new max
            if (err.code === 11000 && err.keyPattern && err.keyPattern.participantNumber && attempts < maxAttempts) {
                continue;
            }
            throw err;
        }
    }

    return savedParticipant;
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
 * @param {Boolean} isAdmin
 */
const withdrawRegistration = async (participantId, userId, isAdmin = false) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Registration not found");
        error.statusCode = 404;
        throw error;
    }

    // Ensure the registration belongs to the requesting user (or admin)
    if (!isAdmin && participant.userId.toString() !== userId.toString()) {
        const error = new Error("Unauthorized to withdraw this registration. You can only manage your own registrations.");
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

/**
 * Normal user revokes withdrawal / reactivates their registration
 * @param {String} participantId
 * @param {String} userId
 * @param {Boolean} isAdmin
 */
const revokeWithdrawRegistration = async (participantId, userId, isAdmin = false) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Registration not found");
        error.statusCode = 404;
        throw error;
    }

    if (!isAdmin && participant.userId.toString() !== userId.toString()) {
        const error = new Error("Unauthorized to modify this registration. You can only manage your own registrations.");
        error.statusCode = 403;
        throw error;
    }

    if (!participant.isWithdraw) {
        const error = new Error("Registration is already active");
        error.statusCode = 400;
        throw error;
    }

    participant.isWithdraw = false;
    participant.modifiedBy = userId;

    return await participant.save();
};

/**
 * User updates their registration details (Audio/Video link, Tower, Flat, Email, etc.)
 * @param {String} participantId
 * @param {String} userId
 * @param {Object} updateData
 * @param {Boolean} isAdmin
 */
const updateParticipant = async (participantId, userId, updateData, isAdmin = false) => {
    const participant = await Participant.findById(participantId);

    if (!participant) {
        const error = new Error("Registration not found");
        error.statusCode = 404;
        throw error;
    }

    if (!isAdmin && participant.userId.toString() !== userId.toString()) {
        const error = new Error("Unauthorized to edit this registration. You can only manage your own registrations.");
        error.statusCode = 403;
        throw error;
    }

    const { fullName, tower, floor, flatNo, email, audioVideoLink } = updateData;

    if (fullName !== undefined && typeof fullName === "string" && fullName.trim()) {
        participant.fullName = fullName.trim();
    }
    if (tower !== undefined) participant.tower = tower ? tower.trim() : "";
    if (floor !== undefined) participant.floor = floor ? String(floor).trim() : "";
    if (flatNo !== undefined) participant.flatNo = flatNo ? flatNo.trim() : "";
    if (email !== undefined) participant.email = email ? email.trim() : "";

    if (audioVideoLink !== undefined) {
        if (audioVideoLink && typeof audioVideoLink === "string" && audioVideoLink.trim() !== "") {
            const trimmed = audioVideoLink.trim();
            try {
                const parsed = new URL(trimmed);
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    throw new Error();
                }
                participant.audioVideoLink = trimmed;
            } catch {
                const error = new Error("Please enter a valid Audio / Video URL (e.g. https://...)");
                error.statusCode = 400;
                throw error;
            }
        } else {
            participant.audioVideoLink = "";
        }
    }

    participant.modifiedBy = userId;
    return await participant.save();
};

/**
 * Get public/registered participants for an activity (for Dashboard Activity Participants Table)
 * @param {String} activityId
 * @param {Object} query { search, includeWithdrawn }
 */
const getPublicActivityParticipants = async (activityId, query = {}) => {
    const filter = {
        activityId
    };

    if (query.includeWithdrawn === "false") {
        filter.isWithdraw = false;
    }

    if (query.search) {
        const searchRegex = { $regex: query.search.trim(), $options: "i" };
        filter.$or = [
            { fullName: searchRegex },
            { tower: searchRegex },
            { flatNo: searchRegex }
        ];
    }

    const participants = await Participant.find(filter)
        .select("participantNumber activityId userId fullName mobile email society tower floor flatNo audioVideoLink isWithdraw isPerformed isCertificateCollected createdDate")
        .sort({ isWithdraw: 1, participantNumber: 1 });

    return participants;
};

module.exports = {
    registerParticipant,
    getMyRegistrations,
    withdrawRegistration,
    revokeWithdrawRegistration,
    updateParticipant,
    getPublicActivityParticipants
};

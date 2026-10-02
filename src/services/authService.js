const UserDirectory = require("../models/UserDirectory");
const { generateToken } = require("../utils/jwt");

/**
 * Login user by phone number
 * @param {String} phone
 * @returns {Object} { token, user }
 */
const login = async (phone) => {
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
        const error = new Error("Phone number is required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedPhone = phone.trim();

    // Look up user in UserDirectory
    const user = await UserDirectory.findOne({ phone: trimmedPhone });

    if (!user) {
        const error = new Error("User not found / not registered");
        error.statusCode = 404;
        throw error;
    }

    // Generate JWT token
    const token = generateToken({
        id: user._id.toString(),
        phone: user.phone,
        isAdmin: Boolean(user.isAdmin)
    });

    return {
        token,
        user: {
            id: user._id.toString(),
            fullName: user.fullName,
            phone: user.phone,
            society: user.society || "",
            tower: user.tower || "",
            floor: user.floor || "",
            flatNumber: user.flatNumber || "",
            isAdmin: Boolean(user.isAdmin)
        }
    };
};

/**
 * Get current user profile by user ID
 * @param {String} userId
 */
const getUserProfile = async (userId) => {
    const user = await UserDirectory.findById(userId);
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    return {
        id: user._id.toString(),
        fullName: user.fullName,
        phone: user.phone,
        society: user.society || "",
        tower: user.tower || "",
        floor: user.floor || "",
        flatNumber: user.flatNumber || "",
        isAdmin: Boolean(user.isAdmin),
        createdOn: user.createdOn,
        modifiedOn: user.modifiedOn
    };
};

module.exports = {
    login,
    getUserProfile
};

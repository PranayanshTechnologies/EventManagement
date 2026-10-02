const UserDirectory = require("../models/UserDirectory");
const { generateToken } = require("../utils/jwt");

/**
 * Login / Check user by phone number
 * Distinguishes existing user vs new user
 * @param {String} phone
 * @returns {Object} { isNewUser, token?, user?, phone? }
 */
const login = async (phone) => {
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
        const error = new Error("Phone number is required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedPhone = phone.trim().replace(/[^0-9]/g, "");

    if (trimmedPhone.length !== 10) {
        const error = new Error("Please provide a valid 10-digit mobile number");
        error.statusCode = 400;
        throw error;
    }

    // Look up user in UserDirectory
    const user = await UserDirectory.findOne({ phone: trimmedPhone });

    if (!user) {
        // Return clean response indicating new user registration is required
        return {
            isNewUser: true,
            phone: trimmedPhone,
            message: "New mobile number. Please complete registration."
        };
    }

    // Existing user: Generate JWT token
    const token = generateToken({
        id: user._id.toString(),
        phone: user.phone,
        isAdmin: Boolean(user.isAdmin)
    });

    return {
        isNewUser: false,
        token,
        user: {
            id: user._id.toString(),
            fullName: user.fullName,
            phone: user.phone,
            email: user.email || "",
            society: user.society || "",
            tower: user.tower || "",
            floor: user.floor || "",
            flatNumber: user.flatNumber || "",
            isAdmin: Boolean(user.isAdmin)
        }
    };
};

/**
 * Register a new user in UserDirectory
 * Strictly forces isAdmin: false for security
 * @param {Object} userData { fullName, phone, society, tower, floor, flatNumber, email }
 * @returns {Object} { isNewUser: false, token, user }
 */
const register = async (userData) => {
    const { fullName, phone, society, tower, floor, flatNumber, email } = userData;

    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
        const error = new Error("Full name is required");
        error.statusCode = 400;
        throw error;
    }

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
        const error = new Error("Phone number is required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedPhone = phone.trim().replace(/[^0-9]/g, "");

    if (trimmedPhone.length !== 10) {
        const error = new Error("Please provide a valid 10-digit mobile number");
        error.statusCode = 400;
        throw error;
    }

    // Check if phone was already registered (concurrency/idempotency protection)
    let user = await UserDirectory.findOne({ phone: trimmedPhone });

    if (!user) {
        // Create new user in UserDirectory with isAdmin: false explicitly enforced
        user = new UserDirectory({
            fullName: fullName.trim(),
            phone: trimmedPhone,
            email: email ? String(email).trim() : "",
            society: society ? String(society).trim() : "",
            tower: tower ? String(tower).trim() : "",
            floor: floor !== undefined && floor !== null ? String(floor).trim() : "",
            flatNumber: flatNumber !== undefined && flatNumber !== null ? String(flatNumber).trim() : "",
            isAdmin: false // Never trust client input for isAdmin
        });

        await user.save();
    }

    // Generate JWT token
    const token = generateToken({
        id: user._id.toString(),
        phone: user.phone,
        isAdmin: Boolean(user.isAdmin)
    });

    return {
        isNewUser: false,
        token,
        user: {
            id: user._id.toString(),
            fullName: user.fullName,
            phone: user.phone,
            email: user.email || "",
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
        email: user.email || "",
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
    register,
    getUserProfile
};

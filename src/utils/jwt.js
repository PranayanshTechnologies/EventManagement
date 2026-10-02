const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "durgotsav_event_default_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate a JWT token with user payload
 * @param {Object} payload - { id, phone, isAdmin }
 * @returns {String} JWT Token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

/**
 * Verify a JWT token
 * @param {String} token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken
};

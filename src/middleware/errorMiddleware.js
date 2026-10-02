const { errorResponse } = require("../utils/response");

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    return errorResponse(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404);
};

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error("Global Error Handler Caught:", err);

    // Mongoose CastError (Invalid ObjectId)
    if (err.name === "CastError") {
        return errorResponse(res, `Invalid ID format: ${err.value}`, 400);
    }

    // Mongoose ValidationError
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((val) => val.message);
        return errorResponse(res, messages.join(", "), 400, messages);
    }

    // MongoDB Duplicate Key Error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return errorResponse(res, `Duplicate value entered for ${field}. Please use another value.`, 400);
    }

    // JSON Parse Error
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return errorResponse(res, "Invalid JSON payload in request body.", 400);
    }

    // Default 500 error
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return errorResponse(res, message, statusCode);
};

module.exports = {
    notFoundHandler,
    errorHandler
};

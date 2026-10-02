/**
 * Standard API Response Utility
 */

const successResponse = (res, message = "Success", data = null, statusCode = 200) => {
    const response = {
        success: true,
        message
    };

    if (data !== null && data !== undefined) {
        if (typeof data === "object" && !Array.isArray(data) && !data.token && !data.user && !data.participants && !data.activities && !data.activity && !data.participant) {
            // merge data or keep structured
            Object.assign(response, data);
        } else {
            // For custom objects with specific keys
            Object.assign(response, typeof data === "object" ? data : { data });
        }
    }

    return res.status(statusCode).json(response);
};

const errorResponse = (res, message = "Internal Server Error", statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse
};

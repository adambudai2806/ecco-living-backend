const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Default error
    let error = {
        statusCode: err.statusCode || 500,
        message: err.message || 'Server Error'
    };

    // Log error
    logger.error(err.message, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { statusCode: 404, message };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { statusCode: 400, message };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { statusCode: 400, message };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { statusCode: 401, message };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { statusCode: 401, message };
    }

    // PostgreSQL errors
    if (err.code === '23505') { // Unique violation
        const message = 'Duplicate entry';
        error = { statusCode: 400, message };
    }

    if (err.code === '23503') { // Foreign key violation
        const message = 'Referenced record does not exist';
        error = { statusCode: 400, message };
    }

    if (err.code === '23502') { // Not null violation
        const message = 'Required field missing';
        error = { statusCode: 400, message };
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
        error.message = 'Internal Server Error';
    }

    res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
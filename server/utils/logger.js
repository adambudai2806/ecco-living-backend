const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        if (stack) {
            return `${timestamp} [${level}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level}]: ${message}`;
    })
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'ecco-living',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Combined log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Daily rotating log
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log') 
        })
    ],
    
    // Handle unhandled rejections
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log') 
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Add console transport for production errors
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.Console({
        level: 'error',
        format: consoleFormat
    }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

// Helper functions
const createChildLogger = (service) => {
    return logger.child({ service });
};

const logRequest = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
    });
    next();
};

const logError = (error, req = null) => {
    const logData = {
        message: error.message,
        stack: error.stack,
        ...(req && {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            body: req.body,
            params: req.params,
            query: req.query
        })
    };

    logger.error('Application Error', logData);
};

const logSecurityEvent = (event, details, req = null) => {
    const logData = {
        event,
        details,
        ...(req && {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            url: req.originalUrl
        })
    };

    logger.warn('Security Event', logData);
};

const logDatabaseQuery = (query, duration) => {
    if (process.env.LOG_DB_QUERIES === 'true') {
        logger.debug('Database Query', {
            query,
            duration: `${duration}ms`
        });
    }
};

const logApiCall = (endpoint, method, statusCode, duration, userId = null) => {
    logger.info('API Call', {
        endpoint,
        method,
        statusCode,
        duration: `${duration}ms`,
        userId
    });
};

// Performance monitoring
const performanceTimer = (label) => {
    const start = Date.now();
    return {
        end: () => {
            const duration = Date.now() - start;
            logger.info(`Performance: ${label}`, { duration: `${duration}ms` });
            return duration;
        }
    };
};

module.exports = {
    logger,
    createChildLogger,
    logRequest,
    logError,
    logSecurityEvent,
    logDatabaseQuery,
    logApiCall,
    performanceTimer
};
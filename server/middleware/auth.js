const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authorized to access this route'
                });
            }

            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    error: 'Account is not active'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Require admin role
const requireAdmin = async (req, res, next) => {
    await protect(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
    });
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (user && user.status === 'active') {
                req.user = user;
            }
        } catch (error) {
            // Ignore errors in optional auth
        }
    }

    next();
};

module.exports = {
    protect,
    authorize,
    requireAdmin,
    optionalAuth
};
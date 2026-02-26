/**
 * Authentication Middleware
 * Handles JWT verification and user authorization
 * Author: Talha
 * Date: Sprint 1
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify user is authenticated
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
const protect = async (req, res, next) => {
    let token;
    
    try {
        // Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Extract token from Bearer header
            token = req.headers.authorization.split(' ')[1];
        }
        
        // Check if token exists
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized to access this route. No token provided.' 
            });
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from database (exclude password)
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found with this token' 
                });
            }
            
            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Your account has been deactivated. Please contact admin.' 
                });
            }
            
            // Attach user to request object
            req.user = user;
            next();
            
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid token. Please log in again.' 
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Token expired. Please log in again.' 
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error in authentication' 
        });
    }
};

/**
 * Authorize by role - Check if user has required role
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role ${req.user.role} is not authorized to access this route. Required roles: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
};

/**
 * Check if user is seller or admin
 */
const sellerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'User not authenticated' 
        });
    }
    
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'This action requires seller or admin privileges' 
        });
    }
    
    next();
};

/**
 * Check if user is admin only
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'User not authenticated' 
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'This action requires admin privileges' 
        });
    }
    
    next();
};

module.exports = {
    protect,
    authorize,
    sellerOnly,
    adminOnly
};
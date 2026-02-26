/**
 * Authentication Routes
 * Defines API endpoints for authentication and user management
 * Author: Talha
 * Date: Sprint 1
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile
} = require('../controllers/authController');

/**
 * Validation rules for registration
 */
const registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('email')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number')
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
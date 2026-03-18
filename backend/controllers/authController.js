/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 * Author: Talha
 * Date: Sprint 1
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Helper: generate a JWT token for a given user ID
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "30d"
    });
};

// Helper: check if express-validator found any errors
const checkValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
        return false;
    }
    return true;
};

/**
 * POST /api/auth/register
 * Creates a new user account
 */
const registerUser = async (req, res) => {
    try {
        // Step 1: Check if validation rules passed (from authRoutes.js)
        if (!checkValidation(req, res)) return;

        // Step 2: Pull fields from the request body
        const { name, username, email, password, role, phone, address } = req.body;

        // Step 3: Check if a user already has this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username already taken" });
        }

        // Step 4: Only allow "user" or "seller" roles — never "admin" via registration
        const userRole = (role === "seller") ? "seller" : "user";

        // Step 5: Create user — password gets hashed automatically by User model
        const user = await User.create({ name, username: username.toLowerCase(), email, password, role: userRole, phone: phone || undefined, address: address || undefined  });

        // Step 6: Generate JWT token so they are logged in immediately
        const token = generateToken(user._id);

        // Step 7: Record when they last logged in
        user.lastLogin = Date.now();
        await user.save();

        // Step 8: Send back token and safe user info (no password)
        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: { _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, phone: user.phone, address: user.address }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 */
const loginUser = async (req, res) => {
    try {
        // Check validation
        if (!checkValidation(req, res)) return;

        const { identifier, password } = req.body;

        // Find user — must explicitly select password since it is excluded by default
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        }).select("+password");

        if (!user) {
            // Use vague message to not reveal if email exists
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({ success: false, message: "Account deactivated. Contact admin." });
        }

        // Compare entered password with stored hash using bcrypt
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Generate a new JWT token
        const token = generateToken(user._id);

        // Update last login timestamp
        user.lastLogin = Date.now();
        await user.save();

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: { _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, phone: user.phone, address: user.address }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * GET /api/auth/profile
 * Returns the logged-in user's profile
 */
const getProfile = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        res.json({ success: true, user: req.user.getPublicProfile() });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * PUT /api/auth/profile
 * Updates the logged-in user's profile
 */
const updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findById(req.user._id);

        // Only update fields that were provided
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = { ...user.address, ...address };

        await user.save();
        res.json({ success: true, message: "Profile updated", user: user.getPublicProfile() });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile };

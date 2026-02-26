/**
 * User Model
 * Defines schema for user accounts in the auction system
 * Includes authentication fields, profile information, and user roles
 * Author: Talha
 * Date: Sprint 1
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define user schema
const userSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Name is required'],           // Custom error message
        trim: true,                                      // Remove whitespace
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,                                    // No duplicate emails
        lowercase: true,                                 // Convert to lowercase
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false                                    // Don't return password by default in queries
    },
    
    // Role Management
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],              // Allowed roles
        default: 'user'
    },
    
    // Profile Information
    profilePicture: {
        type: String,
        default: 'default-avatar.png'
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9+\-\s]+$/, 'Please enter a valid phone number']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'USA' }
    },
    
    // User Statistics
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    
    // Account Status
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Verification and Reset Tokens
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // User Preferences
    watchlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction'                                    // Reference to Auction model
    }],
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        outbid: { type: Boolean, default: true },
        auctionEnd: { type: Boolean, default: true }
    },
    
    // Firebase Cloud Messaging token for push notifications
    fcmToken: String,
    
    // Timestamps
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,  // Automatically manage createdAt and updatedAt
    toJSON: { virtuals: true },  // Include virtuals when converting to JSON
    toObject: { virtuals: true }
});

/**
 * Pre-save middleware
 * Hashes password before saving to database
 */
userSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-update middleware
 * Updates the updatedAt field
 */
userSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: Date.now() });
});

/**
 * Compare entered password with stored hash
 * @param {string} enteredPassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token
 * @returns {string} - JWT token
 */
userSchema.methods.generateAuthToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            id: this._id, 
            email: this.email, 
            role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

/**
 * Get public profile (remove sensitive information)
 * @returns {Object} - Public user object
 */
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.verificationToken;
    delete userObject.resetPasswordToken;
    delete userObject.fcmToken;
    return userObject;
};

// Virtual for user's auctions
userSchema.virtual('auctions', {
    ref: 'Auction',
    localField: '_id',
    foreignField: 'seller'
});

// Virtual for user's bids
userSchema.virtual('bids', {
    ref: 'Bid',
    localField: '_id',
    foreignField: 'bidder'
});

// Create indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'address.city': 1, 'address.country': 1 });

module.exports = mongoose.model('User', userSchema);
/**
 * Item Model
 * Represents items put up for auction
 * Author: Rakib
 * Date: Sprint 1
 */

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [20, 'Description must be at least 20 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    
    // Seller reference (who listed this item)
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Images (basic for now - will enhance later)
    images: [{
        url: {
            type: String,
            default: 'default-item.jpg'
        },
        publicId: String, // For cloud storage later
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    
    // Item details
    condition: {
        type: String,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
        default: 'Good'
    },
    
    // Status of the item
    status: {
        type: String,
        enum: ['available', 'in_auction', 'sold'],
        default: 'available'
    },
    
    // Category (will be expanded in later sprints)
    category: {
        type: String,
        default: 'Other'
    },
    
    // Metadata
    views: {
        type: Number,
        default: 0
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update timestamps on save
itemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search functionality
itemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);

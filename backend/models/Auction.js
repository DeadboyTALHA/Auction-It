/**
 * Auction Model
 * Represents an auction listing with timing and pricing
 * Author: Rakib
 * Date: Sprint 1
 */

const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    // Reference to the item being auctioned
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    
    // Seller reference
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Auction pricing
    startPrice: {
        type: Number,
        required: [true, 'Start price is required'],
        min: [0.01, 'Start price must be greater than 0']
    },
    currentPrice: {
        type: Number,
        default: function() {
            return this.startPrice;
        }
    },
    reservePrice: {
        type: Number,
        min: 0,
        default: 0 // 0 means no reserve
    },
    
    // Bidding rules
    minIncrement: {
        type: Number,
        required: [true, 'Minimum bid increment is required'],
        min: [0.01, 'Increment must be greater than 0'],
        default: 1.00
    },
    
    // Auction timing
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
        validate: {
            validator: function(value) {
                // Start time must be in the future
                return value > new Date();
            },
            message: 'Start time must be in the future'
        }
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required'],
        validate: {
            validator: function(value) {
                // End time must be after start time
                return value > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    
    // Auction status
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'ended', 'cancelled', 'sold'],
        default: 'pending' // pending admin approval (for later)
    },
    
    // Statistics
    totalBids: {
        type: Number,
        default: 0
    },
    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Winner information (populated when auction ends)
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    finalPrice: Number,
    
    // Admin approval (for later)
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    
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
auctionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if auction is active
auctionSchema.methods.isActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           now >= this.startTime && 
           now <= this.endTime;
};

// Method to check if auction has started
auctionSchema.methods.hasStarted = function() {
    return new Date() >= this.startTime;
};

// Method to check if auction has ended
auctionSchema.methods.hasEnded = function() {
    return new Date() > this.endTime;
};

// Method to get time remaining in milliseconds
auctionSchema.methods.getTimeRemaining = function() {
    if (this.hasEnded()) return 0;
    return this.endTime - new Date();
};

// Method to place a bid (will be used by bidding system)
auctionSchema.methods.placeBid = function(amount) {
    if (!this.isActive()) {
        throw new Error('Auction is not active');
    }
    if (amount <= this.currentPrice) {
        throw new Error('Bid must be higher than current price');
    }
    if (amount < this.currentPrice + this.minIncrement) {
        throw new Error(`Bid must be at least ${this.minIncrement} higher`);
    }
    
    this.currentPrice = amount;
    this.totalBids += 1;
    return true;
};

// Indexes for better query performance
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ seller: 1, status: 1 });
auctionSchema.index({ 'item.category': 1 });
auctionSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
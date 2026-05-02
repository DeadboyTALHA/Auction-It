/**
 * Main Server File
 * Entry point for the Auction It backend application
 * Sets up Express server, middleware, routes, and database connection
 * Author: Talha
 * Date: Sprint 1
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const sellerRoutes = require('./routes/sellerRoutes');
const buyerRoutes     = require('./routes/buyerRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Notification        = require('./models/Notification');
const issueRoutes        = require('./routes/issueRoutes');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

// ── Sprint 2 additions (Talha) ──
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes    = require("./routes/adminRoutes");
// Talha end

const bidRoutes = require('./routes/bidRoutes');

// Import role middleware at the top (add this with other imports)
const { protect, sellerOnly, adminOnly } = require('./middleware/auth');

const ratingRoutes = require('./routes/ratingRoutes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Auto-end auctions every minute
const Auction = require('./models/Auction');
const Bid     = require('./models/Bid');
const Watchlist = require('./models/Watchlist');

const autoEndAuctions = async () => {
    try {
        const now = new Date();
        // Find all active auctions whose endTime has passed
        const expiredAuctions = await Auction.find({
            status: 'active',
            endTime: { $lte: now }
        });

        for (const auction of expiredAuctions) {
            // Find the highest bid
            const highestBid = await Bid.findOne({ auction: auction._id })
                .sort({ amount: -1 })
                .populate('bidder', 'name')
                .populate({ path: 'auction', populate: { path: 'item', select: 'title' } });


            const reserveMet = !auction.reservePrice ||
                auction.reservePrice <= 0 ||
                (highestBid && highestBid.amount >= auction.reservePrice);

            if (highestBid && reserveMet) {
                auction.status          = 'pending_payment';
                auction.winner          = highestBid.bidder._id;
                auction.finalPrice      = highestBid.amount;
                auction.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

                // Notify winner — normal win
                const winnerNotif = await Notification.create({
                    user:    highestBid.bidder._id,
                    auction: auction._id,
                    type:    'bid_ending',
                    message: `You won the auction for "${highestBid.auction?.item?.title || 'an item'}" at BDT ${highestBid.amount}. Please pay within 24 hours.`
                });
                io.to(`user-${highestBid.bidder._id}`).emit('new-notification', {
                    _id: winnerNotif._id, message: winnerNotif.message,
                    auction: { _id: auction._id, status: 'pending_payment' }
                });

            } else if (highestBid && !reserveMet) {
                auction.status = 'ended';

                // Notify highest bidder — reserve not met
                const bidderNotif = await Notification.create({
                    user:    highestBid.bidder._id,
                    auction: auction._id,
                    type:    'reserve_not_met',
                    message: `You were the highest bidder for "${highestBid.auction?.item?.title || 'an item'}" but unfortunately the reserve price was not reached.`
                });
                io.to(`user-${highestBid.bidder._id}`).emit('new-notification', {
                    _id: bidderNotif._id, message: bidderNotif.message,
                    auction: { _id: auction._id }, type: 'reserve_not_met'
                });

                // Notify seller
                const sellerNotif = await Notification.create({
                    user:    auction.seller,
                    auction: auction._id,
                    type:    'payment_failed',
                    message: `Your auction "${highestBid.auction?.item?.title || 'an item'}" ended but the reserve price was not met. You may restart or delete it.`,
                    persistent: true
                });
                io.to(`user-${auction.seller}`).emit('new-notification', {
                    _id: sellerNotif._id, message: sellerNotif.message,
                    auction: { _id: auction._id }, type: 'payment_failed'
                });

            } else {
                // No bids at all
                auction.status = 'ended';
            }
            await auction.save();
            await Watchlist.deleteMany({ auction: auction._id });

            console.log(`Auction ${auction._id} ended. Status: ${auction.status}`);
        }
    } catch (err) {
        console.error('Auto-end auctions error:', err);
    }
};

// Run immediately on startup, then every 60 seconds
autoEndAuctions();
setInterval(autoEndAuctions, 60 * 1000);


// 5-minute auction deadline notifications
const checkEndingSoon = async () => {
    try {
        const now     = new Date();
        const in5min  = new Date(now.getTime() + 5 * 60 * 1000);
        const in6min  = new Date(now.getTime() + 6 * 60 * 1000);

        // Find auctions ending in the next 5-6 minute window
        const endingSoon = await Auction.find({
            status: "active",
            endTime: { $gte: in5min, $lte: in6min }
        });

        for (const auction of endingSoon) {
            // Notify bidders
            const bids = await Bid.find({ auction: auction._id }).distinct("bidder");
            for (const userId of bids) {
                const exists = await Notification.findOne({
                    user: userId, auction: auction._id, type: "bid_ending"
                });
                if (!exists) {
                    const notif = await Notification.create({
                        user:    userId,
                        auction: auction._id,
                        type:    "bid_ending",
                        message: "5 Minutes remaining for your Bidded Auction"
                    });
                    // Emit real-time notification to user
                    io.to(`user-${userId}`).emit("new-notification", {
                        _id:     notif._id,
                        message: notif.message,
                        type:    notif.type,
                        auction: { _id: auction._id }
                    });
                }
            }
            // Notify watchlisters
            const watchers = await Watchlist.find({ auction: auction._id });
            for (const w of watchers) {
                const exists = await Notification.findOne({
                    user: w.user, auction: auction._id, type: "watchlist_ending"
                });
                if (!exists) {
                    const notif = await Notification.create({
                        user:    w.user,
                        auction: auction._id,
                        type:    "watchlist_ending",
                        message: "5 Minutes remaining for your Watchlisted Auction"
                    });
                    io.to(`user-${w.user}`).emit("new-notification", {
                        _id:     notif._id,
                        message: notif.message,
                        type:    notif.type,
                        auction: { _id: auction._id }
                    });
                }
            }
        }
    } catch (err) {
        console.error("checkEndingSoon error:", err);
    }
};

checkEndingSoon();
setInterval(checkEndingSoon, 60 * 1000);

// Payment reminder job — runs every 30 minutes
const Payment = require("./models/Payment");

const checkPaymentDeadlines = async () => {
    try {
        const now = new Date();

        // Find pending_payment auctions
        const pendingAuctions = await Auction.find({
            status: "pending_payment",
            paymentDeadline: { $gt: now }
        }).populate("item", "title").populate("winner", "_id");

        for (const auction of pendingAuctions) {
            const msLeft = auction.paymentDeadline - now;
            const hrLeft = msLeft / (1000 * 60 * 60);

            // 6-hour reminder (fires between 5.9hr and 6.1hr marks)
            const isAt6hr = hrLeft <= 18 && hrLeft > 17.9 ||
                            hrLeft <= 12 && hrLeft > 11.9 ||
                            hrLeft <= 6  && hrLeft > 5.9;
            // 1hr warning
            const isAt1hr   = hrLeft <= 1    && hrLeft > 0.95;
            // 30min warning
            const isAt30min = hrLeft <= 0.5  && hrLeft > 0.45;
            // 10min warning
            const isAt10min = hrLeft <= 0.167 && hrLeft > 0.133;

            let msg = null;
            if (isAt6hr)    msg = `Reminder: Please complete payment for "${auction.item?.title}". Time is running out.`;
            if (isAt1hr)    msg = `1 hour left to pay for "${auction.item?.title}"!`;
            if (isAt30min)  msg = `30 minutes left to pay for "${auction.item?.title}"!`;
            if (isAt10min)  msg = `URGENT: Only 10 minutes left to pay for "${auction.item?.title}"!`;

            if (msg && auction.winner) {
                const notif = await Notification.create({
                    user:    auction.winner._id,
                    auction: auction._id,
                    type:    "bid_ending",
                    message: msg
                });
                io.to(`user-${auction.winner._id}`).emit("new-notification", {
                    _id: notif._id, message: notif.message,
                    auction: { _id: auction._id }
                });
            }
        }

        // Find expired unpaid auctions
        const expiredUnpaid = await Auction.find({
            status: "pending_payment",
            paymentDeadline: { $lte: now }
        }).populate("item", "title").populate("seller", "_id name");

        for (const auction of expiredUnpaid) {
            // Change status to ended
            auction.status = "ended";
            await auction.save();

            // Notify seller with persistent notification (cannot dismiss)
            const sellerNotif = await Notification.create({
                user:        auction.seller._id,
                auction:     auction._id,
                type:        "payment_failed",
                message:     `Payment was not completed for "${auction.item?.title}". Choose to restart or delete.`,
                persistent:  true
            });
            io.to(`user-${auction.seller._id}`).emit("new-notification", {
                _id: sellerNotif._id, message: sellerNotif.message,
                auction: { _id: auction._id }, type: "payment_failed"
            });
        }
    } catch (err) {
        console.error("checkPaymentDeadlines error:", err);
    }
};

checkPaymentDeadlines();
setInterval(checkPaymentDeadlines, 30 * 60 * 1000); // every 30 minutes



// ======================
// MIDDLEWARE
// ======================

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// ROUTES
// ======================

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Auction It API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);

// Sprint 2 routes (Talha)
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
// Talha end

app.use('/api/seller', sellerRoutes);
app.use('/api/buyer',     buyerRoutes);
app.use('/api/watchlist', watchlistRoutes);

//notification
app.use('/api/notifications', notificationRoutes);
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments',      paymentRoutes);
app.use('/api/issues',        issueRoutes);
app.use('/api/ratings', ratingRoutes);

// ======================
// TEST ROUTES FOR ROLE VERIFICATION
// ======================

// Test route for authentication
app.get('/api/test-auth', protect, (req, res) => {
    res.json({
        success: true,
        message: 'Authentication working',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Test route for seller access
app.get('/api/test-seller', protect, sellerOnly, (req, res) => {
    res.json({
        success: true,
        message: 'Seller access granted',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Test route for admin access
app.get('/api/test-admin', protect, adminOnly, (req, res) => {
    res.json({
        success: true,
        message: 'Admin access granted',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Test route to check user role
app.get('/api/test-role', protect, (req, res) => {
    res.json({
        success: true,
        message: `Your role is: ${req.user.role}`,
        role: req.user.role,
        permissions: {
            isSeller: req.user.role === 'seller' || req.user.role === 'admin',
            isAdmin: req.user.role === 'admin',
            canCreateAuction: req.user.role === 'seller' || req.user.role === 'admin',
            canBid: true // All users can bid
        }
    });
});

// More routes will be added in later sprints

// ======================
// ERROR HANDLING
// ======================

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Default error
    let error = { ...err };
    error.message = err.message;
    
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }
    
    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `Duplicate field value: ${field}. Please use another value.`;
        error = { message, statusCode: 400 };
    }
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }
    
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ======================
// SOCKET.IO SETUP
// ======================

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Join user's personal room
    socket.on('authenticate', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`Socket ${socket.id} joined user-${userId}`);
    });
    
    // Join auction room for real-time bidding
    socket.on('join-auction', (auctionId) => {
        socket.join(`auction-${auctionId}`);
        console.log(`Socket ${socket.id} joined auction-${auctionId}`);
    });
    
    // Leave auction room
    socket.on('leave-auction', (auctionId) => {
        socket.leave(`auction-${auctionId}`);
        console.log(`Socket ${socket.id} left auction-${auctionId}`);
    });

    // Chat room — join when opening a chat page
    socket.on('join-chat', (reportId) => {
        socket.join(`chat-${reportId}`);
        console.log(`Socket ${socket.id} joined chat-${reportId}`);
    });

    socket.on('leave-chat', (reportId) => {
        socket.leave(`chat-${reportId}`);
    });

    // Handle new bid
    socket.on('new-bid', (data) => {
        // Broadcast to all clients in the auction room
        io.to(`auction-${data.auctionId}`).emit('bid-updated', data);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server started successfully!`);
    console.log(`📡 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`💓 Health: http://localhost:${PORT}/health`);
    console.log(`=================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    console.log(err.stack);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    console.log(err.stack);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('💤 Process terminated!');
    });
});
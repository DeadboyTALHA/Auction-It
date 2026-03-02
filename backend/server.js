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

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

const bidRoutes = require('./routes/bidRoutes');

// Import role middleware at the top (add this with other imports)
const { protect, sellerOnly, adminOnly } = require('./middleware/auth');

// More routes will be added in later sprints

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


app.use('/api/auctions', auctionRoutes);


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
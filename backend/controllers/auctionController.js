/**
 * Auction Controller
 * Handles auction creation and management
 * Author: Rakib
 * Date: Sprint 1
 */

const Auction = require('../models/Auction');
const Item = require('../models/Item');
const mongoose = require('mongoose');

/**
 * @desc    Create a new auction listing
 * @route   POST /api/auctions
 * @access  Private (Seller only)
 */
const createAuction = async (req, res) => {
    try {
        // Check if user is seller (middleware already does this, but double-check)
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can create auctions'
            });
        }

        const {
            title,
            description,
            condition,
            category,
            startPrice,
            reservePrice,
            minIncrement,
            startTime,
            endTime
        } = req.body;

        // Validate required fields
        if (!title || !description || !startPrice || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

 // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create the item first
            const item = await Item.create([{
                title,
                description,
                seller: req.user._id,
                condition: condition || 'Good',
                category: category || 'Other',
                images,
                status: 'in_auction'
            }], { session });

            // Create the auction
            const auction = await Auction.create([{
                item: item[0]._id,
                seller: req.user._id,
                startPrice: parseFloat(startPrice),
                currentPrice: parseFloat(startPrice),
                reservePrice: parseFloat(reservePrice) || 0,
                minIncrement: parseFloat(minIncrement) || 1.00,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status: new Date(startTime) <= new Date() ? 'active' : 'pending'
            }], { session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            // Populate the auction with item details
            const populatedAuction = await Auction.findById(auction[0]._id)
                .populate('item')
                .populate('seller', 'name email');

            res.status(201).json({
                success: true,
                message: 'Auction created successfully',
                data: populatedAuction
            });

        } catch (error) {
            // Abort transaction on error
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error('Create auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create auction',
            error: error.message
        });
    }
};

/**
 * @desc    Get seller's auctions
 * @route   GET /api/auctions/my-auctions
 * @access  Private (Seller)
 */
const getMyAuctions = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = { seller: req.user._id };
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const auctions = await Auction.find(query)
            .populate('item')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Auction.countDocuments(query);

        res.json({
            success: true,
            data: auctions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get my auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your auctions',
            error: error.message
        });
    }
};

/**
 * @desc    Update auction
 * @route   PUT /api/auctions/:id
 * @access  Private (Seller only)
 */
const updateAuction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find auction
        const auction = await Auction.findById(id).populate('item');
        
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if user owns this auction
        if (auction.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own auctions'
            });
        }

        // Check if auction can be updated (only if not started or ended)
        if (auction.hasStarted && auction.hasStarted() && auction.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update auction after it has started'
            });
        }

        const {
            title,
            description,
            condition,
            category,
            startPrice,
            reservePrice,
            minIncrement,
            endTime
        } = req.body;

        // Update item if fields provided
        if (auction.item) {
            const itemUpdates = {};
            if (title) itemUpdates.title = title;
            if (description) itemUpdates.description = description;
            if (condition) itemUpdates.condition = condition;
            if (category) itemUpdates.category = category;
            
            if (Object.keys(itemUpdates).length > 0) {
                await Item.findByIdAndUpdate(auction.item._id, itemUpdates);
            }
        }

        // Update auction
        const auctionUpdates = {};
        if (startPrice) auctionUpdates.startPrice = parseFloat(startPrice);
        if (reservePrice) auctionUpdates.reservePrice = parseFloat(reservePrice);
        if (minIncrement) auctionUpdates.minIncrement = parseFloat(minIncrement);
        if (endTime) {
            // Validate new end time
            const newEndTime = new Date(endTime);
            if (newEndTime <= auction.startTime) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time'
                });
            }
            auctionUpdates.endTime = newEndTime;
        }

        const updatedAuction = await Auction.findByIdAndUpdate(
            id,
            auctionUpdates,
            { new: true, runValidators: true }
        ).populate('item');

        res.json({
            success: true,
            message: 'Auction updated successfully',
            data: updatedAuction
        });

    } catch (error) {
        console.error('Update auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update auction',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel auction
 * @route   DELETE /api/auctions/:id
 * @access  Private (Seller only)
 */
const cancelAuction = async (req, res) => {
    try {
        const { id } = req.params;
        
        const auction = await Auction.findById(id);
        
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if user owns this auction
        if (auction.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own auctions'
            });
        }

        // Check if auction can be cancelled (only if no bids)
        if (auction.totalBids > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel auction with existing bids'
            });
        }

        auction.status = 'cancelled';
        await auction.save();

        // Also update item status
        await Item.findByIdAndUpdate(auction.item, {
            status: 'available'
        });

        res.json({
            success: true,
            message: 'Auction cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel auction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel auction',
            error: error.message
        });
    }
};

/**
 * @desc    Get all active auctions with search and filters
 * @route   GET /api/auctions/browse
 * @access  Public
 */
const browseAuctions = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            condition,
            sortBy = 'endTime',
            sortOrder = 'asc',
            page = 1,
            limit = 12
        } = req.query;

        // Build query - only show active auctions
        const query = { status: 'active' };
        
        // Keyword search (title and description)
        if (search && search.trim()) {
            query.$or = [
                { 'item.title': { $regex: search, $options: 'i' } },
                { 'item.description': { $regex: search, $options: 'i' } }
            ];
        }
        
        // Filter by category
        if (category && category !== 'all') {
            query['item.category'] = category;
        }
        
        // Filter by condition
        if (condition && condition !== 'all') {
            query['item.condition'] = condition;
        }
        
        // Filter by price range
        if (minPrice || maxPrice) {
            query.currentPrice = {};
            if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        switch(sortBy) {
            case 'price':
                sort.currentPrice = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'endTime':
                sort.endTime = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'bids':
                sort.totalBids = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            default:
                sort.endTime = 1;
        }

        // Execute query with population
        const auctions = await Auction.find(query)
            .populate({
                path: 'item',
                select: 'title description images condition category'
            })
            .populate('seller', 'name rating')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const total = await Auction.countDocuments(query);

        // Get unique categories for filter
        const categories = await Auction.aggregate([
            { $match: { status: 'active' } },
            {
                $lookup: {
                    from: 'items',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'itemInfo'
                }
            },
            { $unwind: '$itemInfo' },
            {
                $group: {
                    _id: '$itemInfo.category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get price range for filter
        const priceRange = await Auction.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$currentPrice' },
                    maxPrice: { $max: '$currentPrice' }
                }
            }
        ]);

        // Add time remaining to each auction
        const now = new Date();
        const auctionsWithTime = auctions.map(auction => {
            const timeRemaining = auction.endTime - now;
            return {
                ...auction,
                timeRemaining: Math.max(0, timeRemaining),
                isEndingSoon: timeRemaining > 0 && timeRemaining < 3600000, // 1 hour in ms
                status: timeRemaining <= 0 ? 'ended' : auction.status
            };
        });

        res.json({
            success: true,
            data: auctionsWithTime,
            filters: {
                categories: categories.map(c => ({
                    name: c._id || 'Other',
                    count: c.count
                })),
                priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 },
                conditions: ['New', 'Like New', 'Good', 'Fair', 'Poor']
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
                hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Browse auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch auctions',
            error: error.message
        });
    }
};

/**
 * @desc    Search auctions by keyword
 * @route   GET /api/auctions/search
 * @access  Public
 */
const searchAuctions = async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        // Search in items collection first
        const items = await Item.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        }).select('_id');

        const itemIds = items.map(item => item._id);

        // Find active auctions for these items
        const query = {
            status: 'active',
            item: { $in: itemIds }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const auctions = await Auction.find(query)
            .populate({
                path: 'item',
                select: 'title description images condition category'
            })
            .populate('seller', 'name rating')
            .sort({ endTime: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Auction.countDocuments(query);

        // Add relevance score (simple implementation)
        const auctionsWithScore = auctions.map(auction => {
            let score = 0;
            const title = auction.item.title.toLowerCase();
            const desc = auction.item.description.toLowerCase();
            const searchTerm = q.toLowerCase();

            if (title.includes(searchTerm)) score += 10;
            if (title.startsWith(searchTerm)) score += 5;
            if (desc.includes(searchTerm)) score += 3;

            return {
                ...auction,
                relevanceScore: score
            };
        });

        // Sort by relevance
        auctionsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

        res.json({
            success: true,
            data: auctionsWithScore,
            query: q,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Search auctions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search auctions',
            error: error.message
        });
    }
};

/**
 * @desc    Get ending soon auctions
 * @route   GET /api/auctions/ending-soon
 * @access  Public
 */
const getEndingSoonAuctions = async (req, res) => {
    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        const auctions = await Auction.find({
            status: 'active',
            endTime: { $gte: now, $lte: oneHourFromNow }
        })
            .populate({
                path: 'item',
                select: 'title images'
            })
            .populate('seller', 'name')
            .sort({ endTime: 1 })
            .limit(6);

        res.json({
            success: true,
            data: auctions
        });

    } catch (error) {
        console.error('Get ending soon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ending soon auctions',
            error: error.message
        });
    }
};

// Export all auction controller functions
module.exports = {
    // Rakib’'s functions (Auction Management)
    createAuction,
    getMyAuctions,
    updateAuction,
    cancelAuction,
    
    // Farhan’s functions (Browsing & Search)
    browseAuctions,
    searchAuctions,
    getEndingSoonAuctions
};

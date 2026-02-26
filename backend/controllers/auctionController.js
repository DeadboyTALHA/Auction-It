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

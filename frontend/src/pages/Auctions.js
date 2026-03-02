/**
 * Auctions Browse Page
 * Displays all active auctions with search and filters
 * Includes countdown timers and automatic status updates
 * Author: Farhan
 * Date: Sprint 1
 */

import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Typography,
    Box,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Button,
    Paper,
    Chip,
    Pagination,
    Skeleton,
    Alert,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Sort as SortIcon
} from '@mui/icons-material';
import auctionService from '../services/auction';
import AuctionCard from '../components/AuctionCard';

const Auctions = () => {
    // State for auctions data
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for filters
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        condition: 'all',
        minPrice: '',
        maxPrice: '',
        sortBy: 'endTime',
        sortOrder: 'asc',
        page: 1
    });

    // State for filter options from API
    const [filterOptions, setFilterOptions] = useState({
        categories: [],
        priceRange: { minPrice: 0, maxPrice: 10000 },
        conditions: []
    });

    // State for pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
    });

    // State for showing filters on mobile
    const [showFilters, setShowFilters] = useState(false);

    // Load auctions on mount and when filters change
    useEffect(() => {
        loadAuctions();
    }, [filters.page, filters.sortBy, filters.sortOrder]);

    // Debounced search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            loadAuctions();
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.search, filters.category, filters.condition, filters.minPrice, filters.maxPrice]);

    const loadAuctions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await auctionService.browseAuctions({
                search: filters.search,
                category: filters.category !== 'all' ? filters.category : undefined,
                condition: filters.condition !== 'all' ? filters.condition : undefined,
                minPrice: filters.minPrice || undefined,
                maxPrice: filters.maxPrice || undefined,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                page: filters.page,
                limit: 12
            });

            setAuctions(response.data);
            setFilterOptions({
                categories: response.filters.categories || [],
                priceRange: response.filters.priceRange || { minPrice: 0, maxPrice: 10000 },
                conditions: response.filters.conditions || []
            });
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message || 'Failed to load auctions');
            console.error('Error loading auctions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({
            ...prev,
            search: e.target.value,
            page: 1 // Reset to first page on new search
        }));
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1 // Reset to first page on filter change
        }));
    };

    const handlePriceChange = (event, newValue) => {
        setFilters(prev => ({
            ...prev,
            minPrice: newValue[0],
            maxPrice: newValue[1],
            page: 1
        }));
    };

    const handleSortChange = (e) => {
        const [sortBy, sortOrder] = e.target.value.split('-');
        setFilters(prev => ({
            ...prev,
            sortBy,
            sortOrder
        }));
    };

    const handlePageChange = (event, value) => {
        setFilters(prev => ({
            ...prev,
            page: value
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: 'all',
            condition: 'all',
            minPrice: '',
            maxPrice: '',
            sortBy: 'endTime',
            sortOrder: 'asc',
            page: 1
        });
    };

    const handleAuctionExpire = (auctionId) => {
        // Remove expired auction from list or update its status
        setAuctions(prev => prev.filter(a => a._id !== auctionId));
    };

    // Loading skeletons
    if (loading && auctions.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Active Auctions
                </Typography>
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <Grid item xs={12} sm={6} md={4} key={n}>
                            <Skeleton variant="rectangular" height={400} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Active Auctions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Discover and bid on unique items from sellers around the world
                </Typography>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search auctions by title or description..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={`${filters.sortBy}-${filters.sortOrder}`}
                                onChange={handleSortChange}
                                label="Sort By"
                                startAdornment={<SortIcon sx={{ mr: 1 }} />}
                            >
                                <MenuItem value="endTime-asc">Ending Soon</MenuItem>
                                <MenuItem value="endTime-desc">Ending Later</MenuItem>
                                <MenuItem value="price-asc">Price: Low to High</MenuItem>
                                <MenuItem value="price-desc">Price: High to Low</MenuItem>
                                <MenuItem value="bids-desc">Most Bids</MenuItem>
                                <MenuItem value="newest-desc">Newest First</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Filters Panel */}
            {showFilters && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Filters
                        </Typography>
                        <Button 
                            size="small" 
                            onClick={clearFilters}
                            startIcon={<ClearIcon />}
                        >
                            Clear All
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Category Filter */}
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    label="Category"
                                >
                                    <MenuItem value="all">All Categories</MenuItem>
                                    {filterOptions.categories.map((cat) => (
                                        <MenuItem key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.count})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Condition Filter */}
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Condition</InputLabel>
                                <Select
                                    value={filters.condition}
                                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                                    label="Condition"
                                >
                                    <MenuItem value="all">All Conditions</MenuItem>
                                    {filterOptions.conditions.map((cond) => (
                                        <MenuItem key={cond} value={cond}>
                                            {cond}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Price Range Filter */}
                        <Grid item xs={12} md={4}>
                            <Typography gutterBottom>
                                Price Range
                            </Typography>
                            <Box sx={{ px: 2 }}>
                                <Slider
                                    value={[
                                        filters.minPrice || filterOptions.priceRange.minPrice,
                                        filters.maxPrice || filterOptions.priceRange.maxPrice
                                    ]}
                                    onChange={handlePriceChange}
                                    valueLabelDisplay="auto"
                                    min={filterOptions.priceRange.minPrice}
                                    max={filterOptions.priceRange.maxPrice}
                                    step={10}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <TextField
                                    size="small"
                                    label="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    sx={{ width: '45%' }}
                                />
                                <TextField
                                    size="small"
                                    label="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    sx={{ width: '45%' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Active Filters Display */}
            {(filters.category !== 'all' || filters.condition !== 'all' || filters.search) && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Active Filters:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {filters.search && (
                            <Chip 
                                label={`Search: ${filters.search}`}
                                onDelete={() => handleFilterChange('search', '')}
                                size="small"
                            />
                        )}
                        {filters.category !== 'all' && (
                            <Chip 
                                label={`Category: ${filters.category}`}
                                onDelete={() => handleFilterChange('category', 'all')}
                                size="small"
                            />
                        )}
                        {filters.condition !== 'all' && (
                            <Chip 
                                label={`Condition: ${filters.condition}`}
                                onDelete={() => handleFilterChange('condition', 'all')}
                                size="small"
                            />
                        )}
                        {(filters.minPrice || filters.maxPrice) && (
                            <Chip 
                                label={`Price: $${filters.minPrice || 0} - $${filters.maxPrice || 'Any'}`}
                                onDelete={() => {
                                    handleFilterChange('minPrice', '');
                                    handleFilterChange('maxPrice', '');
                                }}
                                size="small"
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Results Count */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Found {pagination.total} auctions
                </Typography>
            </Box>

            {/* Auctions Grid */}
            {auctions.length === 0 && !loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        No auctions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or search criteria
                    </Typography>
                    <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {auctions.map((auction) => (
                        <Grid item xs={12} sm={6} md={4} key={auction._id}>
                            <AuctionCard 
                                auction={auction} 
                                onExpire={handleAuctionExpire}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={pagination.pages}
                        page={filters.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}
        </Container>
    );
};

export default Auctions;

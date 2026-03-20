/**
 * Auction Card Component
 * Displays individual auction item in grid/list
 * Includes countdown timer
 * Author: Farhan
 * Date: Sprint 1
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    Chip,
    Avatar,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    Gavel as GavelIcon,
    Person as PersonIcon,
    TrendingUp as TrendingIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon
} from '@mui/icons-material';
import CountdownTimer from './CountdownTimer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';


const AuctionCard = ({ auction, onExpire }) => {
    const navigate = useNavigate();

    // Format currency
    const formatPrice = (price) => {
        return `BDT ${Number(price || 0).toLocaleString('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

    // Get image URL
    const getImageUrl = () => {
        if (auction.item?.images && auction.item.images.length > 0) {
            const primaryImage = auction.item.images.find(img => img.isPrimary) || auction.item.images[0];
            return primaryImage.url || 'default-auction.jpg';
        }
        return 'default-auction.jpg';
    };

    // Handle card click
    const handleClick = () => {
        navigate(`/auction/${auction._id}`);
    };

    // Handle auction expiration
    const handleExpire = () => {
        console.log(`Auction ${auction._id} has ended`);
        if (onExpire) {
            onExpire(auction._id);
        }
    };
    // Admin: featured toggle
    const { isAdmin, isAuthenticated } = useAuth();
    const [inWatchlist,      setInWatchlist]      = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    const handleWatchlist = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return;
        setWatchlistLoading(true);
        try {
            if (inWatchlist) {
                await api.delete(`/watchlist/${auction._id}`);
                setInWatchlist(false);
            } else {
                await api.post(`/watchlist/${auction._id}`);
                setInWatchlist(true);
            }
        } catch (err) {
            if (err.response?.data?.message === 'Auction already in watchlist') {
                setInWatchlist(true);
            }
        } finally {
            setWatchlistLoading(false);
        }
    };
    const [featured, setFeatured] = useState(auction.isFeatured || false);
    const [featLoading, setFeatLoading] = useState(false);

    const handleToggleFeatured = async (e) => {
        e.stopPropagation(); // prevent navigating to detail page
        setFeatLoading(true);
        try {
            const res = await api.put(`/admin/auctions/${auction._id}/feature`);
            setFeatured(res.data.data.isFeatured);
        } catch (err) {
            console.error('Failed to toggle featured:', err);
        } finally {
            setFeatLoading(false);
        }
    };


    return (
        <Card 
            sx={{ 
                height: "100%",
                minHeight: 480,
                display: "flex", 
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    cursor: "pointer"
                }
            }}
            onClick={handleClick}
        >
            {/* Image Section */}
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl()}
                    alt={auction.item?.title || 'Auction item'}
                    sx={{ objectFit: 'cover' }}
                />
                {isAuthenticated && (
                    <IconButton
                        onClick={handleWatchlist}
                        disabled={watchlistLoading}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.45)',
                            color: inWatchlist ? '#e53935' : 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            padding: '6px',
                        }}
                    >
                        {inWatchlist
                            ? <FavoriteIcon fontSize="small" />
                            : <FavoriteBorderIcon fontSize="small" />
                        }
                    </IconButton>
                )}
            </Box>

            {/* Content Section */}
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Title and Condition */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6" component="h3" noWrap sx={{ maxWidth: "70%" }}>
                        {auction.item?.title || "Untitled"}
                    </Typography>
                    <Chip
                        label={auction.item?.condition || "Good"}
                        size="small"
                        color={auction.item?.condition === "New" ? "success" : "default"}
                    />
                </Box>

                {/* Category chip */}
                {auction.category?.name && (
                    <Box sx={{ mb: 1 }}>
                        <Chip
                            label={auction.category.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: "11px" }}
                        />
                    </Box>
                )}

                {/* Description — truncated with ...see more */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {auction.item?.description
                            ? <>
                                {auction.item.description.slice(0, 15)}
                                {auction.item.description.length > 15 && (
                                    <>
                                        {'... '}
                                        <Typography
                                            component="span"
                                            variant="caption"
                                            color="primary.main"
                                            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/auction/${auction._id}`);
                                            }}
                                        >
                                            see more
                                        </Typography>
                                    </>
                                )}
                            </>
                            : 'No description'
                        }
                    </Typography>
                </Box>

                {/* Price and Bids */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Current Bid
                        </Typography>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(auction.currentPrice)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                            Total Bids
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <GavelIcon fontSize="small" color="action" />
                            <Typography variant="body1">
                                {auction.totalBids || 0}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Timer */}
                <Box sx={{ mb: 2 }}>
                    <CountdownTimer 
                        endTime={auction.endTime} 
                        onExpire={handleExpire}
                        size="small"
                    />
                </Box>

                {/* Seller Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                        {auction.seller?.name || 'Unknown Seller'}
                    </Typography>
                    {auction.seller?.rating > 0 && (
                        <Tooltip title={`Rating: ${auction.seller.rating}`}>
                            <Chip 
                                icon={<TrendingIcon />} 
                                label={auction.seller.rating.toFixed(1)}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                            />
                        </Tooltip>
                    )}
                </Box>
            </CardContent>

            {/* Actions */}
            <CardActions sx={{ flexDirection: "column", gap: 0.5 }}>
                <Button 
                    size="small" 
                    color="primary"
                    fullWidth
                    variant="contained"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auction/${auction._id}`);
                    }}
                >
                    View Auction
                </Button>
                {isAdmin && (
                    <Button
                        size="small"
                        fullWidth
                        variant={featured ? "contained" : "outlined"}
                        color={featured ? "warning" : "inherit"}
                        onClick={handleToggleFeatured}
                        disabled={featLoading}
                    >
                        {featured ? "★ Featured" : "☆ Feature This"}
                    </Button>
                )}
            </CardActions>

        </Card>
    );
};

export default AuctionCard;

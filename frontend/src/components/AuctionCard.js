/**
 * Auction Card Component
 * Displays individual auction item in grid/list
 * Includes countdown timer
 * Author: Farhan
 * Date: Sprint 1
 */

import React from 'react';
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
    Tooltip
} from '@mui/material';
import {
    Gavel as GavelIcon,
    Person as PersonIcon,
    TrendingUp as TrendingIcon
} from '@mui/icons-material';
import CountdownTimer from './CountdownTimer';

const AuctionCard = ({ auction, onExpire }) => {
    const navigate = useNavigate();

    // Format currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
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

    return (
        <Card 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    cursor: 'pointer'
                }
            }}
            onClick={handleClick}
        >
            {/* Image Section */}
            <CardMedia
                component="img"
                height="200"
                image={getImageUrl()}
                alt={auction.item?.title || 'Auction item'}
                sx={{ objectFit: 'cover' }}
            />

            {/* Content Section */}
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Title and Condition */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h3" noWrap sx={{ maxWidth: '70%' }}>
                        {auction.item?.title || 'Untitled'}
                    </Typography>
                    <Chip 
                        label={auction.item?.condition || 'Good'} 
                        size="small"
                        color={auction.item?.condition === 'New' ? 'success' : 'default'}
                    />
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '40px'
                }}>
                    {auction.item?.description || 'No description'}
                </Typography>

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
            <CardActions>
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
            </CardActions>
        </Card>
    );
};

export default AuctionCard;

/**
 * Ending Soon Component
 * Displays auctions ending in the next hour
 * Auto-refreshes every minute
 * Author: Farhan
 * Date: Sprint 1
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Button,
    Skeleton,
    Alert
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import auctionService from '../services/auction';
import CountdownTimer from './CountdownTimer';

const EndingSoon = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadEndingSoon();

        // Refresh every minute
        const interval = setInterval(loadEndingSoon, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadEndingSoon = async () => {
        try {
            const response = await auctionService.getEndingSoon();
            setAuctions(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load ending soon auctions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Ending Soon
                </Typography>
                <Grid container spacing={2}>
                    {[1, 2, 3].map((n) => (
                        <Grid item xs={12} sm={6} md={4} key={n}>
                            <Skeleton variant="rectangular" height={200} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 4 }}>
                {error}
            </Alert>
        );
    }

    if (auctions.length === 0) {
        return null; // Don't show section if no ending soon auctions
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimeIcon color="warning" />
                <Typography variant="h5">
                    Ending Soon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    Last chance to bid!
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {auctions.map((auction) => (
                    <Grid item xs={12} sm={6} md={4} key={auction._id}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => navigate(`/auction/${auction._id}`)}
                        >
                            <CardMedia
                                component="img"
                                height="140"
                                image={auction.item?.images?.[0]?.url || 'default-auction.jpg'}
                                alt={auction.item?.title}
                            />
                            <CardContent>
                                <Typography variant="h6" noWrap>
                                    {auction.item?.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Current: {formatPrice(auction.currentPrice)}
                                </Typography>
                                <CountdownTimer 
                                    endTime={auction.endTime}
                                    size="small"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                    variant="outlined" 
                    onClick={() => navigate('/auctions?sortBy=endTime&sortOrder=asc')}
                >
                    View All Auctions
                </Button>
            </Box>
        </Box>
    );
};

export default EndingSoon;

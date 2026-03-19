/**
 * Auction Detail Page
 * Shows full details of a single auction and allows bidding
 * Author: Talha
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Grid, Typography, Box, Button, Paper,
    TextField, Alert, Chip, Divider, CircularProgress
} from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';

const AuctionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, isAdmin } = useAuth();

    const [auction, setAuction] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [bidError, setBidError] = useState('');
    const [bidSuccess, setBidSuccess] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const [featured,     setFeatured]     = useState(false);
    const [featLoading,  setFeatLoading]  = useState(false);


    useEffect(() => {
        loadAuction();
        loadBids();
    }, [id]);

    const loadAuction = async () => {
        try {
            // First try active auctions
            const res = await api.get(`/auctions/browse`);
            let found = (res.data.data || []).find(a => a._id === id);

            // If not found in active, try all statuses (ended, sold, etc.)
            if (!found) {
                const allRes = await api.get(`/auctions/browse?status=ended`);
                found = (allRes.data.data || []).find(a => a._id === id);
            }
            if (!found) {
                const soldRes = await api.get(`/auctions/browse?status=sold`);
                found = (soldRes.data.data || []).find(a => a._id === id);
            }

            if (found) {
                setAuction(found);
                setFeatured(found.isFeatured || false);
            } else {
                setError('Auction not found');
            }
        } catch (err) {
            setError('Failed to load auction');
        } finally {
            setLoading(false);
        }
    };

    const loadBids = async () => {
        try {
            const res = await api.get(`/bids/${id}`);
            setBids(res.data.bids || []);
        } catch (err) {
            // Bids might be empty, that's fine
        }
    };

    const handleToggleFeatured = async () => {
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

    const handleBid = async () => {
        setBidError('');
        setBidSuccess('');

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const amount = parseFloat(bidAmount);
        if (!amount || amount <= 0) {
            setBidError('Please enter a valid bid amount');
            return;
        }

        setBidLoading(true);
        try {
            const res = await api.post(`/bids/${id}`, { amount });
            setBidSuccess(`Bid of BDT ${amount} placed successfully!`);
            setBidAmount('');
            // Refresh auction and bids
            loadAuction();
            loadBids();
        } catch (err) {
            setBidError(err.response?.data?.message || 'Failed to place bid');
        } finally {
            setBidLoading(false);
        }
    };

    if (loading) return (
        <Container sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress />
        </Container>
    );

    if (error) return (
        <Container sx={{ py: 4 }}>
            <Alert severity="error">{error}</Alert>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/auctions')}>
                Back to Auctions
            </Button>
        </Container>
    );

    if (!auction) return null;

    const isSeller = user?._id === auction.seller?._id;
    const minBid = (auction.currentPrice || 0) + (auction.minIncrement || 1);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button onClick={() => navigate('/auctions')} sx={{ mb: 2 }}>
                ← Back to Auctions
            </Button>

            <Grid container spacing={4}>
                {/* Left — Item details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        {/* Image placeholder */}
                        <Box sx={{
                            width: '100%', height: 300, bgcolor: '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 3, borderRadius: 1
                        }}>
                            {auction.item?.images?.length > 0
                                ? <img src={auction.item.images[0].url} alt={auction.item.title}
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                : <Typography color="text.secondary">No image available</Typography>
                            }
                        </Box>

                        <Typography variant="h4" gutterBottom>
                            {auction.item?.title || 'Untitled'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip label={auction.item?.condition || 'Good'} color="primary" size="small" />
                            <Chip label={auction.status} size="small"
                                color={auction.status === 'active' ? 'success' : 'default'} />
                        </Box>

                        <Typography variant="body1" color="text.secondary" paragraph>
                            {auction.item?.description || 'No description provided.'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2">
                            <strong>Seller:</strong> {auction.seller?.name || 'Unknown'}
                        </Typography>
                    </Paper>

                    {/* Bid History */}
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Bid History ({bids.length})
                        </Typography>
                        {bids.length === 0 ? (
                            <Typography color="text.secondary">No bids yet. Be the first!</Typography>
                        ) : (
                            bids.map((bid, i) => (
                                <Box key={bid._id} sx={{
                                    display: 'flex', justifyContent: 'space-between',
                                    py: 1, borderBottom: '1px solid #eee'
                                }}>
                                    <Typography variant="body2">
                                        {bid.bidder?.name || 'Anonymous'}
                                    </Typography>
                                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                                        ${bid.amount}
                                    </Typography>
                                </Box>
                            ))
                        )}
                    </Paper>
                </Grid>

                {/* Right — Bid panel */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
                        <Typography variant="h6" gutterBottom>Auction Info</Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">Current Bid</Typography>
                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                BDT {auction.currentPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {auction.totalBids || 0} bids placed
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary">Time Remaining</Typography>
                            <CountdownTimer endTime={auction.endTime} size="large" />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {isAdmin && (
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    fullWidth
                                    variant={featured ? "contained" : "outlined"}
                                    color={featured ? "warning" : "inherit"}
                                    onClick={handleToggleFeatured}
                                    disabled={featLoading}
                                    size="large"
                                >
                                    {featured ? "★ Remove from Featured" : "☆ Feature this Auction"}
                                </Button>
                                {featured && (
                                    <Typography variant="caption" color="warning.main"
                                        sx={{ display: "block", mt: 0.5, textAlign: "center" }}>
                                        This auction is currently featured on the homepage
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {isSeller ? (

                            <Alert severity="info">You cannot bid on your own auction.</Alert>
                        ) : auction.status !== 'active' ? (
                            <Alert severity="warning">This auction is not active.</Alert>
                        ) : !isAuthenticated ? (
                            <Box>
                                <Alert severity="info" sx={{ mb: 1 }}>Login to place a bid</Alert>
                                <Button fullWidth variant="contained" onClick={() => navigate('/login')}>
                                    Login to Bid
                                </Button>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Minimum bid: <strong>BDT {minBid}</strong>
                                </Typography>
                                {bidError && <Alert severity="error" sx={{ mb: 1 }}>{bidError}</Alert>}
                                {bidSuccess && <Alert severity="success" sx={{ mb: 1 }}>{bidSuccess}</Alert>}
                                <TextField
                                    fullWidth
                                    label="Your Bid ($)"
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    inputProps={{ min: minBid, step: auction.minIncrement || 1 }}
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    startIcon={<GavelIcon />}
                                    onClick={handleBid}
                                    disabled={bidLoading}
                                >
                                    {bidLoading ? 'Placing Bid...' : 'Place Bid'}
                                </Button>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                            Min increment: BDT {auction.minIncrement || 1}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AuctionDetail;

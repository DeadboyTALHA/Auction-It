/**
 * Auction Detail Page
 * Shows full details of a single auction and allows bidding
 * Author: Talha
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Grid, Typography, Box, Button, Paper,
    TextField, Alert, Chip, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, IconButton
} from '@mui/material';
import { Gavel as GavelIcon, Favorite as FavoriteIcon,
         FavoriteBorder as FavoriteBorderIcon } from '@mui/icons-material';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

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

    const [deleteDialog,   setDeleteDialog]   = useState(false);
    const [deleteLoading,  setDeleteLoading]  = useState(false);
    const [inWatchlist,    setInWatchlist]    = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    const [autoBidDialog,  setAutoBidDialog]  = useState(false);
    const [autoBidLimit,   setAutoBidLimit]   = useState("");
    const [autoBidActive,  setAutoBidActive]  = useState(false);
    const [autoBidError,   setAutoBidError]   = useState("");


    useEffect(() => {
        loadAuction();
        loadBids();

        // Connect to Socket.io and join this auction room
        const socket = io('http://localhost:5000');
        socket.emit('join-auction', id);

        // Listen for real-time bid updates
        socket.on('bid-updated', (data) => {
            if (data.auctionId === id) {
                // Update current price and total bids instantly
                setAuction(prev => prev ? {
                    ...prev,
                    currentPrice: data.currentPrice,
                    totalBids:    data.totalBids
                } : prev);
                // Add new bid to top of bid history
                setBids(prev => [data.newBid, ...prev]);
            }
        });

        socket.on('increment-updated', (data) => {
            if (data.auctionId === id) {
                setAuction(prev => prev ? {
                    ...prev,
                    minIncrement: data.minIncrement
                } : prev);
            }
        });

        // Cleanup on unmount
        return () => {
            socket.emit('leave-auction', id);
            socket.disconnect();
        };
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
                // Check if user has this in their watchlist
                if (isAuthenticated) {
                    try {
                        const wRes = await api.get("/watchlist");
                        const items = wRes.data.data || [];
                        setInWatchlist(items.some(w => w.auction?._id === found._id));
                    } catch (e) { /* ignore */ }
                }
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

    const handleDeleteAuction = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/auctions/${auction._id}`);
            navigate("/auctions");
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleWatchlist = async () => {
        if (!isAuthenticated) { navigate("/login"); return; }
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

    const handleSetAutoBid = async () => {
        setAutoBidError("");
        const limit = parseFloat(autoBidLimit);
        if (!limit || limit <= auction.currentPrice) {
            setAutoBidError("Limit must be above current price of BDT " + auction.currentPrice);
            return;
        }
        try {
            await api.post(`/bids/${id}/autobid`, { limitPrice: limit });
            setAutoBidActive(true);
            setAutoBidDialog(false);
            setAutoBidLimit("");
            loadAuction();
            loadBids();
        } catch (err) {
            setAutoBidError(err.response?.data?.message || "Failed to set auto-bid");
        }
    };

    const handleTurnOffAutoBid = async () => {
        try {
            await api.delete(`/bids/${id}/autobid`);
            setAutoBidActive(false);
        } catch (err) {
            console.error("Failed to turn off auto-bid:", err);
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
                        {/* Images — side by side */}
                        {auction.item?.images?.length > 0 ? (
                            <Box sx={{
                                display: "flex",
                                gap: 1.5,
                                mb: 3,
                                overflowX: "auto",
                                pb: 0.5
                            }}>
                                {auction.item.images.map((img, idx) => {
                                    const url = img.url?.startsWith("http")
                                        ? img.url
                                        : `http://localhost:5000/uploads/${img.url}`;
                                    return (
                                        <Box key={idx} sx={{
                                            flex: "0 0 auto",
                                            width: auction.item.images.length === 1 ? "100%" : 220,
                                            height: 260,
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            border: idx === 0 ? "2px solid #2E75B6" : "1px solid #ddd"
                                        }}>
                                            <img src={url} alt={`${auction.item.title} ${idx + 1}`}
                                                style={{
                                                    width: "100%", height: "100%",
                                                    objectFit: "cover"
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Box sx={{
                                width: "100%", height: 260, bgcolor: "#f0f0f0",
                                display: "flex", alignItems: "center",
                                justifyContent: "center", mb: 3, borderRadius: 1
                            }}>
                                <Typography color="text.secondary">No image available</Typography>
                            </Box>
                        )}


                        <Typography variant="h4" gutterBottom>
                            {auction.item?.title || 'Untitled'}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                            <Chip label={auction.item?.condition || "Good"} color="primary" size="small" />
                            <Chip label={auction.status} size="small"
                                color={auction.status === "active" ? "success" : "default"} />
                            {auction.category?.name && (
                                <Chip
                                    label={auction.category.name}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            )}
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
                            bids.map((bid, i) => {
                                const bidDate = bid.createdAt ? new Date(bid.createdAt) : null;
                                const dateStr = bidDate ? bidDate.toLocaleDateString("en-BD", {
                                    day: "2-digit", month: "short", year: "numeric"
                                }) : "";
                                const timeStr = bidDate ? bidDate.toLocaleTimeString("en-BD", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                                    hour12: true
                                }) : "";
                                return (
                                    <Box key={bid._id} sx={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "center",
                                        py: 1.5, borderBottom: "1px solid #eee"
                                    }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {bid.bidder?.name || "Anonymous"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {dateStr} at {timeStr}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                                            BDT {bid.amount}
                                        </Typography>
                                    </Box>
                                );
                            })
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
                                                {/* Watchlist button — for all logged-in users */}
                        
                        {isAuthenticated && !isSeller && (
                            <Button
                                fullWidth
                                variant={inWatchlist ? "contained" : "outlined"}
                                color={inWatchlist ? "error" : "inherit"}
                                onClick={handleWatchlist}
                                disabled={watchlistLoading}
                                sx={{ mb: 2 }}
                                startIcon={inWatchlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            >
                                {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                            </Button>
                        )}

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
                        {/* Show "was featured" for ended auctions */}
                        {!isAdmin && auction.isFeatured && auction.status !== "active" && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: "warning.light",
                                borderRadius: 1, textAlign: "center" }}>
                                <Typography variant="body2" color="warning.dark" fontWeight="bold">
                                    ★ This auction was featured on the homepage
                                </Typography>
                            </Box>
                        )}
                        {/* Also show for active featured auctions to non-admins */}
                        {!isAdmin && auction.isFeatured && auction.status === "active" && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: "warning.light",
                                borderRadius: 1, textAlign: "center" }}>
                                <Typography variant="body2" color="warning.dark" fontWeight="bold">
                                    ★ This auction is featured on the homepage
                                </Typography>
                            </Box>
                        )}
                        

                        {/* Admin delete button */}
                        {isAdmin && (
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                onClick={() => setDeleteDialog(true)}
                                sx={{ mb: 2 }}
                            >
                                Delete This Auction
                            </Button>
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
                                    {/* Auto-Bid section - added above the bid input */}
                                    {autoBidActive ? (
                                        <Button fullWidth variant="contained"
                                            sx={{ mb: 2, bgcolor: "#F57F17", "&:hover": { bgcolor: "#E65100" } }}
                                            onClick={handleTurnOffAutoBid}
                                        >
                                            Turn Off Auto-Bid
                                        </Button>
                                    ) : (
                                        <Button fullWidth variant="contained"
                                            sx={{ mb: 2, bgcolor: "#F9A825", "&:hover": { bgcolor: "#F57F17" },
                                                color: "#000" }}
                                            onClick={() => setAutoBidDialog(true)}
                                        >
                                            Auto-Bid
                                        </Button>
                                    )}
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Minimum bid: <strong>BDT {minBid}</strong>
                                    </Typography>
                                    {bidError && <Alert severity="error" sx={{ mb: 1 }}>{bidError}</Alert>}
                                    {bidSuccess && <Alert severity="success" sx={{ mb: 1 }}>{bidSuccess}</Alert>}
                                    <TextField
                                        fullWidth
                                        label="Your Bid (BDT)"
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
                            )
                        }

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                            Min increment: BDT {auction.minIncrement || 1}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
            
        {/* Admin delete confirmation dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
                maxWidth="xs" fullWidth>
                <DialogTitle>Delete Auction</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete
                        <strong> {auction?.item?.title}</strong>?
                        This removes the auction, all bids, and watchlist entries.
                        This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)} disabled={deleteLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAuction} color="error"
                        variant="contained" disabled={deleteLoading}>
                        {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={autoBidDialog} onClose={() => setAutoBidDialog(false)}
                maxWidth="xs" fullWidth>
                <DialogTitle>Set Auto-Bid</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="error" fontWeight="bold" sx={{ mb: 2 }}>
                        Please Choose The Auto Bidding Limit Carefully
                    </Typography>
                    {autoBidError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{autoBidError}</Alert>
                    )}
                    <TextField fullWidth label="Auto-Bid Limit (BDT)" type="number"
                        value={autoBidLimit}
                        onChange={(e) => setAutoBidLimit(e.target.value)}
                        helperText={`Current price: BDT ${auction?.currentPrice}. Auto-bid will stop when limit is reached.`}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAutoBidDialog(false)}>Cancel</Button>
                    <Button onClick={handleSetAutoBid} variant="contained" color="warning">
                        Apply Auto-Bid
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AuctionDetail;

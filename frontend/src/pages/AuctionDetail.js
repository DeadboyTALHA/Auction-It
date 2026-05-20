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
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

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
    const [featureReqDialog,  setFeatureReqDialog]  = useState(false);
    const [featureReqLoading, setFeatureReqLoading] = useState(false);
    const [featureReqSent,    setFeatureReqSent]    = useState(false);

    const [reviewsDialog,   setReviewsDialog]   = useState(false);
    const [sellerReviews,   setSellerReviews]   = useState([]);
    const [reviewsLoading,  setReviewsLoading]  = useState(false);

    const formatBDT = (amount) => {
        if (amount === null || amount === undefined) return "0.00";
        return parseFloat(amount).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    useEffect(() => {
        loadAuction();
        loadBids();

        // Connect to Socket.io and join this auction room
        const socket = io(process.env.REACT_APP_API_URL);
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
            // Try all statuses in one request using 'all' or multiple calls
            const statuses = ['active', 'ended', 'sold', 'pending_payment'];
            let found = null;

            for (const st of statuses) {
                if (found) break;
                try {
                    const res = await api.get(`/auctions/browse?status=${st}&limit=200`);
                    found = (res.data.data || []).find(a => a._id === id) || null;
                } catch (_) {}
            }

            if (found) {
                setAuction(found);
                setFeatured(found.isFeatured || false);
                if (isAuthenticated) {
                    try {
                        const wRes = await api.get('/watchlist');
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

    const handleOpenReviews = async () => {
        if (!auction?.seller?._id) return;
        setReviewsDialog(true);
        setReviewsLoading(true);
        try {
            const res = await api.get(`/ratings/seller/${auction.seller._id}`);
            setSellerReviews(res.data.data || []);
        } catch (e) {
            setSellerReviews([]);
        } finally {
            setReviewsLoading(false);
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

    const handleRequestFeature = async () => {
        setFeatureReqLoading(true);
        try {
            await api.post(`/auctions/${id}/request-feature`);
            setFeatureReqSent(true);
            setFeatureReqDialog(false);
        } catch (err) {
            console.error("Feature request failed:", err);
        } finally {
            setFeatureReqLoading(false);
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
                                    const url = img.url || "https://via.placeholder.com/400x300?text=No+Image";
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

                        <Typography variant='body2'>
                            <strong>Seller:</strong>{' '}
                            <span
                                style={{ color: '#2E75B6', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={handleOpenReviews}
                            >
                                {auction.seller?.name || 'Unknown'}
                            </span>
                            {auction.seller?.rating > 0 && (
                                <span style={{ color: '#F9A825', marginLeft: 6 }}>
                                    {'\u2605'} {parseFloat(auction.seller.rating).toFixed(1)}
                                    <span style={{ color: '#999', fontSize: '0.85em' }}>
                                        {' '}({auction.seller.totalRatings} ratings)
                                    </span>
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                                (click to see reviews)
                            </span>
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
                                            BDT {formatBDT(bid.amount)}
                                        </Typography>
                                    </Box>
                                );
                            })
                        )}
                    </Paper>

                    {/* Bid Price Chart */}
                    {bids.length >= 2 && (() => {
                        // Build chart data from bids (oldest first)
                        const chartData = [...bids]
                            .filter(b => b.createdAt && b.amount)
                            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                            .map(b => ({
                                time: new Date(b.createdAt).toLocaleTimeString("en-BD", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                                    hour12: false
                                }),
                                price: parseFloat(parseFloat(b.amount).toFixed(2)),
                                bidder: b.bidder?.name || "Anonymous"
                            }));

                        const minPrice = Math.min(...chartData.map(d => d.price));
                        const maxPrice = Math.max(...chartData.map(d => d.price));
                        const yPadding = (maxPrice - minPrice) * 0.1 || 100;

                        return (
                            <Paper sx={{ p: 3, mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Bid Price Chart
                                </Typography>
                                <Typography variant="caption" color="text.secondary"
                                    sx={{ display: "block", mb: 2 }}>
                                    Price over time — {chartData.length} bids
                                </Typography>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={chartData}
                                        margin={{ top: 8, right: 24, left: 16, bottom: 48 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis
                                            dataKey="time"
                                            angle={-35}
                                            textAnchor="end"
                                            tick={{ fontSize: 10 }}
                                            label={{
                                                value: "Time",
                                                position: "insideBottom",
                                                offset: -36,
                                                fontSize: 12
                                            }}
                                        />
                                        <YAxis
                                            domain={[minPrice - yPadding, maxPrice + yPadding]}
                                            tickFormatter={v => `BDT ${v.toLocaleString()}`}
                                            tick={{ fontSize: 10 }}
                                            width={90}
                                            label={{
                                                value: "Price (BDT)",
                                                angle: -90,
                                                position: "insideLeft",
                                                offset: 8,
                                                fontSize: 12
                                            }}
                                        />
                                        <RechartsTooltip
                                            formatter={(val, name) => [`BDT ${val.toLocaleString()}`, "Bid"]}
                                            labelFormatter={label => `Time: ${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#2E75B6"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "#2E75B6" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        );
                    })()}

                </Grid>

                {/* Right — Bid panel */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
                        <Typography variant="h6" gutterBottom>Auction Info</Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">Current Bid</Typography>
                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                BDT {formatBDT(auction.currentPrice)}
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
                            <Box>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    You cannot bid on your own auction.
                                </Alert>
                                {!featureReqSent && !auction.isFeatured && (
                                    <Button fullWidth variant="outlined"
                                        color="warning"
                                        onClick={() => setFeatureReqDialog(true)}
                                    >
                                        Request to Feature
                                    </Button>
                                )}
                                {featureReqSent && (
                                    <Alert severity="success" sx={{ mt: 1 }}>
                                        Feature request sent to admin!
                                    </Alert>
                                )}
                            </Box>
                        ) : auction.status !== "active" ? (
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
                                        Minimum bid: <strong>BDT {formatBDT(minBid)}</strong>
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
                            Min increment: BDT {formatBDT(auction.minIncrement || 1)}
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
            <Dialog open={featureReqDialog} onClose={() => setFeatureReqDialog(false)}
                maxWidth="xs" fullWidth>
                <DialogTitle>Request to Feature this Auction</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="error" fontWeight="bold" sx={{ mb: 2 }}>
                        The Platform Fee would be increased from 5% to 8% of the
                        Highest Bid if you feature an auction. You cannot request
                        to undo it. Choose Carefully.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        The admin will review your request and feature your auction.
                        You will be notified when it is accepted.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeatureReqDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleRequestFeature} variant="contained"
                        disabled={featureReqLoading}>
                        {featureReqLoading ? "Sending..." : "Request"}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={reviewsDialog} onClose={() => setReviewsDialog(false)}
                maxWidth='sm' fullWidth>
                <DialogTitle>
                    Reviews for {auction?.seller?.name}
                    {auction?.seller?.rating > 0 && (
                        <span style={{ color: '#F9A825', marginLeft: 8 }}>
                            {'\u2605'} {parseFloat(auction.seller.rating).toFixed(1)}
                        </span>
                    )}
                </DialogTitle>
                <DialogContent dividers sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {reviewsLoading ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress /></Box>
                    ) : sellerReviews.length === 0 ? (
                        <Typography color='text.secondary' sx={{ py: 2 }}>
                            No reviews yet.
                        </Typography>
                    ) : (
                        sellerReviews.map((r, i) => (
                            <Box key={r._id || i} sx={{
                                py: 1.5, borderBottom: i < sellerReviews.length - 1
                                    ? '1px solid #eee' : 'none'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant='body2' fontWeight='bold'>
                                        {r.rater?.name || 'Anonymous'}
                                    </Typography>
                                    <span style={{ color: '#F9A825' }}>
                                        {'\u2605'.repeat(r.stars)}
                                        <span style={{ color: '#ddd' }}>
                                            {'\u2605'.repeat(5 - r.stars)}
                                        </span>
                                    </span>
                                </Box>
                                {r.feedback && (
                                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                        {r.feedback}
                                    </Typography>
                                )}
                                <Typography variant='caption' color='text.secondary'>
                                    {new Date(r.createdAt).toLocaleDateString('en-BD')}
                                </Typography>
                            </Box>
                        ))
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AuctionDetail;

/**
 * User Profile Dashboard
 * Shows user info, their auctions, bid history, watchlist
 * Clicking "Hello, username" in navbar navigates here
 * Author: Farhan
 */

import React, { useState, useEffect } from "react";
import {
    Container, Grid, Typography, Box, Paper, Avatar,
    Tab, Tabs, Chip, Divider, Alert, CircularProgress, Button
} from "@mui/material";
import {
    Person as PersonIcon,
    Gavel as GavelIcon,
    Favorite as WatchlistIcon,
    EmojiEvents as WonIcon,
    Store as StoreIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const TabPanel = ({ children, value, index }) => (
    <Box hidden={value !== index} sx={{ pt: 3 }}>
        {value === index && children}
    </Box>
);

const ProfileDashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [tab,          setTab]          = useState(0);
    const [myAuctions,   setMyAuctions]   = useState([]);
    const [myBids,       setMyBids]       = useState([]);
    const [wonAuctions,  setWonAuctions]  = useState([]);
    const [watchlist,    setWatchlist]    = useState([]);
    const [loading,      setLoading]      = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { navigate("/login"); return; }
        loadAll();
    }, [isAuthenticated]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [bidsRes, wonRes, watchRes] = await Promise.all([
                api.get("/buyer/bids").catch(() => ({ data: { data: [] } })),
                api.get("/buyer/won-auctions").catch(() => ({ data: { data: [] } })),
                api.get("/watchlist").catch(() => ({ data: { data: [] } })),
            ]);
            setMyBids(bidsRes.data.data     || []);
            setWonAuctions(wonRes.data.data || []);
            setWatchlist(watchRes.data.data || []);

            // Load seller auctions if user has seller role
            if (user?.role === "seller" || user?.role === "admin") {
                const sellerRes = await api.get("/seller/auctions").catch(() => ({ data: { data: [] } }));
                setMyAuctions(sellerRes.data.data || []);
            } else {
                // All users can create auctions — fetch from browse filtered by seller
                const browseRes = await api.get("/auctions/browse").catch(() => ({ data: { data: [] } }));
                const mine = (browseRes.data.data || []).filter(a => a.seller?._id === user?._id);
                setMyAuctions(mine);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const statusColor = (status) => {
        if (status === "active") return "success";
        if (status === "ended" || status === "sold") return "error";
        return "default";
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>

            {/* Profile Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: 32 }}>
                            {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h5" fontWeight="bold">{user.name}</Typography>
                        <Typography variant="body1" color="text.secondary">@{user.username}</Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                            <Chip label={user.role} color="primary" size="small" />
                            {user.email && <Chip label={user.email} size="small" variant="outlined" />}
                        </Box>
                    </Grid>
                    <Grid item>
                        <Button variant="outlined" onClick={() => navigate("/auctions/create")}>
                            + List an Item
                        </Button>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    {user.phone && (
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                            <Typography variant="body1">{user.phone}</Typography>
                        </Grid>
                    )}
                    {user.address?.city && (
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Location</Typography>
                            <Typography variant="body1">
                                {[user.address.city, user.address.state, user.address.country]
                                    .filter(Boolean).join(", ")}
                            </Typography>
                        </Grid>
                    )}
                    {user.address?.street && (
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Address</Typography>
                            <Typography variant="body1">{user.address.street}</Typography>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "My Auctions",  value: myAuctions.length,  icon: <StoreIcon />,    color: "#2E75B6" },
                    { label: "Bids Placed",  value: myBids.length,      icon: <GavelIcon />,    color: "#17A589" },
                    { label: "Auctions Won", value: wonAuctions.length, icon: <WonIcon />,      color: "#D35400" },
                    { label: "Watchlist",    value: watchlist.length,   icon: <WatchlistIcon />,color: "#6C3483" },
                ].map(stat => (
                    <Grid item xs={6} sm={3} key={stat.label}>
                        <Paper sx={{ p: 2, textAlign: "center", borderTop: `4px solid ${stat.color}` }}>
                            <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
                                {loading ? "—" : stat.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
                    <Tab label="My Listed Auctions" icon={<StoreIcon />} iconPosition="start" />
                    <Tab label="My Bids"            icon={<GavelIcon />} iconPosition="start" />
                    <Tab label="Auctions Won"       icon={<WonIcon />}   iconPosition="start" />
                    <Tab label="Watchlist"          icon={<WatchlistIcon />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {loading ? (
                        <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
                    ) : (
                        <>
                            {/* My Listed Auctions */}
                            <TabPanel value={tab} index={0}>
                                {myAuctions.length === 0 ? (
                                    <Box sx={{ textAlign: "center", py: 3 }}>
                                        <Typography color="text.secondary">You haven't listed any auctions yet.</Typography>
                                        <Button variant="contained" sx={{ mt: 2 }}
                                            onClick={() => navigate("/auctions/create")}>
                                            List Your First Item
                                        </Button>
                                    </Box>
                                ) : myAuctions.map(a => (
                                    <Box key={a._id} sx={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "center", py: 1.5, borderBottom: "1px solid #eee"
                                    }}>
                                        <Box>
                                            <Typography fontWeight="medium">
                                                {a.item?.title || "Untitled"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {a.totalBids || 0} bids · Ends {new Date(a.endTime).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <Typography fontWeight="bold" color="primary.main">
                                                ${a.currentPrice}
                                            </Typography>
                                            <Chip label={a.status} size="small" color={statusColor(a.status)} />
                                            <Button size="small" onClick={() => navigate(`/auction/${a._id}`)}>
                                                View
                                            </Button>
                                        </Box>
                                    </Box>
                                ))}
                            </TabPanel>

                            {/* My Bids */}
                            <TabPanel value={tab} index={1}>
                                {myBids.length === 0 ? (
                                    <Typography color="text.secondary">You haven't placed any bids yet.</Typography>
                                ) : myBids.map(bid => (
                                    <Box key={bid._id} sx={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "center", py: 1.5, borderBottom: "1px solid #eee"
                                    }}>
                                        <Box>
                                            <Typography fontWeight="medium">
                                                {bid.auction?.item?.title || "Auction"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Current price: ${bid.auction?.currentPrice}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <Typography fontWeight="bold" color="primary.main">
                                                Your bid: ${bid.amount}
                                            </Typography>
                                            <Chip label={bid.auction?.status || "unknown"} size="small"
                                                color={statusColor(bid.auction?.status)} />
                                            <Button size="small"
                                                onClick={() => navigate(`/auction/${bid.auction?._id}`)}>
                                                View
                                            </Button>
                                        </Box>
                                    </Box>
                                ))}
                            </TabPanel>

                            {/* Won Auctions */}
                            <TabPanel value={tab} index={2}>
                                {wonAuctions.length === 0 ? (
                                    <Typography color="text.secondary">You haven't won any auctions yet.</Typography>
                                ) : wonAuctions.map(a => (
                                    <Box key={a._id} sx={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "center", py: 1.5, borderBottom: "1px solid #eee"
                                    }}>
                                        <Box>
                                            <Typography fontWeight="medium">{a.item?.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Seller: {a.seller?.name}
                                            </Typography>
                                        </Box>
                                        <Typography fontWeight="bold" color="success.main">
                                            Won for ${a.finalPrice || a.currentPrice}
                                        </Typography>
                                    </Box>
                                ))}
                            </TabPanel>

                            {/* Watchlist */}
                            <TabPanel value={tab} index={3}>
                                {watchlist.length === 0 ? (
                                    <Typography color="text.secondary">Your watchlist is empty.</Typography>
                                ) : watchlist.map(item => (
                                    <Box key={item._id} sx={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "center", py: 1.5, borderBottom: "1px solid #eee"
                                    }}>
                                        <Box>
                                            <Typography fontWeight="medium">
                                                {item.auction?.item?.title || "Auction"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {item.auction?.totalBids || 0} bids ·
                                                Ends {new Date(item.auction?.endTime).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <Typography fontWeight="bold" color="primary.main">
                                                ${item.auction?.currentPrice}
                                            </Typography>
                                            <Button size="small"
                                                onClick={() => navigate(`/auction/${item.auction?._id}`)}>
                                                View
                                            </Button>
                                        </Box>
                                    </Box>
                                ))}
                            </TabPanel>
                        </>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default ProfileDashboard;
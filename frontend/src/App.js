/**
 * App.js — Main application file
 * Sets up routing, navigation, dark/light mode
 * Author: Farhan | Updated Sprint 2
 */

import React, { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import {
    AppBar, Toolbar, Typography, Button, Box, Container,
    IconButton, Tooltip, Menu, MenuItem, Avatar
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
    DarkMode as DarkIcon,
    LightMode as LightIcon,
    Add as AddIcon
} from "@mui/icons-material";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Page imports
import Home             from "./pages/Home";
import Auctions         from "./pages/Auctions";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import AuctionDetail    from "./pages/AuctionDetail";
import CreateAuction    from "./pages/CreateAuction";
import ProfileDashboard from "./pages/ProfileDashboard";

// Sprint 2 pages
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard  from "./pages/BuyerDashboard";
import WatchlistPage   from "./pages/Watchlist";
import AdminCategories from "./pages/AdminCategories";

// Navigation bar
const Navbar = ({ darkMode, toggleDarkMode }) => {
    const { isAuthenticated, user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = ()  => setAnchorEl(null);
    const handleProfile   = ()  => { handleMenuClose(); navigate("/profile"); };
    const handleLogout    = ()  => { handleMenuClose(); logout(); navigate("/"); };

    return (
        <AppBar position="static" elevation={2}>
            <Toolbar>
                {/* Brand */}
                <Typography
                    variant="h6" component={Link} to="/"
                    sx={{ flexGrow: 1, textDecoration: "none", color: "white", fontWeight: "bold" }}
                >
                    🔨 Auction It
                </Typography>

                {/* Browse */}
                <Button color="inherit" component={Link} to="/auctions">
                    Browse
                </Button>

                {isAuthenticated && (
                    /* Create Auction button for logged-in users */
                    <Button
                        color="inherit" component={Link} to="/auctions/create"
                        startIcon={<AddIcon />}
                        sx={{ mx: 1, border: "1px solid rgba(255,255,255,0.5)", borderRadius: 2 }}
                    >
                        Sell
                    </Button>
                )}

                {/* Dark/Light mode toggle */}
                <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton color="inherit" onClick={toggleDarkMode}>
                        {darkMode ? <LightIcon /> : <DarkIcon />}
                    </IconButton>
                </Tooltip>

                {isAuthenticated ? (
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                        <Tooltip title="View Profile">
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                startIcon={
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                }
                            >
                                {user?.username || user?.name}
                            </Button>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            <MenuItem onClick={handleProfile}>My Profile</MenuItem>
                            <MenuItem onClick={() => { handleMenuClose(); navigate("/auctions/create"); }}>
                                List an Item
                            </MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Box>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

// PrivateRoute: redirects to login if not authenticated
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main App with theme management
const App = () => {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("auction_theme") === "dark";
    });

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem("auction_theme", next ? "dark" : "light");
            return next;
        });
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
            primary: {
                main: "#2E75B6",
            },
            ...(darkMode ? {
                background: { default: "#121212", paper: "#1e1e1e" }
            } : {
                background: { default: "#f5f7fa", paper: "#ffffff" }
            })
        },
    }), [darkMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <AuthProvider>
                    <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};

// Separate component so useNavigate works inside BrowserRouter
const AppContent = ({ darkMode, toggleDarkMode }) => {
    return (
        <>
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/"          element={<Home />} />
                    <Route path="/login"     element={<Login />} />
                    <Route path="/register"  element={<Register />} />
                    <Route path="/auction/:id" element={<AuctionDetail />} />

                    {/* Fix 5: Auctions browse requires login */}
                    <Route path="/auctions" element={
                        <PrivateRoute><Auctions /></PrivateRoute>
                    } />

                    {/* Create Auction — any logged-in user */}
                    <Route path="/auctions/create" element={
                        <PrivateRoute><CreateAuction /></PrivateRoute>
                    } />

                    {/* Profile Dashboard */}
                    <Route path="/profile" element={
                        <PrivateRoute><ProfileDashboard /></PrivateRoute>
                    } />

                    {/* Sprint 2 Routes */}
                    <Route path="/seller/dashboard" element={
                        <PrivateRoute><SellerDashboard /></PrivateRoute>
                    } />
                    <Route path="/buyer/dashboard" element={
                        <PrivateRoute><BuyerDashboard /></PrivateRoute>
                    } />
                    <Route path="/watchlist" element={
                        <PrivateRoute><WatchlistPage /></PrivateRoute>
                    } />
                    <Route path="/admin/categories" element={
                        <PrivateRoute><AdminCategories /></PrivateRoute>
                    } />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Container>
        </>
    );
};

export default App;
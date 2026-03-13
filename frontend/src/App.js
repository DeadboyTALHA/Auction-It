/**
 * App.js — Main application file
 * Sets up routing and navigation
 * Author: Farhan
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Page imports
import Home from "./pages/Home";
import Auctions from "./pages/Auctions";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Farhan Sprint 2

import SellerDashboard  from "./pages/SellerDashboard";
import BuyerDashboard   from "./pages/BuyerDashboard";
import WatchlistPage    from "./pages/Watchlist";
import AdminCategories  from "./pages/AdminCategories";
// Farhan end

// Navigation bar shown on every page
const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <AppBar position="static">
            <Toolbar>
                {/* Logo/brand name links to home */}
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: "none", color: "white" }}>
                    Auction It
                </Typography>

                {/* Navigation buttons */}
                <Button color="inherit" component={Link} to="/auctions">Browse</Button>

                {isAuthenticated ? (
                    // Show user name and logout when logged in
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">Hello, {user?.name}</Typography>
                        <Button color="inherit" onClick={logout}>Logout</Button>
                    </Box>
                ) : (
                    // Show Login and Register when logged out
                    <Box>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

// PrivateRoute: redirects to login if user is not authenticated
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main App component
const App = () => {
    return (
        // BrowserRouter enables URL-based navigation
        <BrowserRouter>
            {/* AuthProvider gives all pages access to login state */}
            <AuthProvider>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                    <Routes>
                        {/* Public routes — anyone can access */}
                        <Route path="/" element={<Home />} />
                        <Route path="/auctions" element={<Auctions />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        {/* Farhan Sprint 2 Routes */}
                        <Route path="/seller/dashboard"  element={<SellerDashboard />} />
                        <Route path="/buyer/dashboard"   element={<BuyerDashboard />} />
                        <Route path="/watchlist"         element={<WatchlistPage />} />
                        <Route path="/admin/categories"  element={<AdminCategories />} />
                        {/* Farhan end */}
                        {/* Catch-all: redirect unknown URLs to home */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Container>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;

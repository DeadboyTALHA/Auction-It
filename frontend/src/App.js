import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import {
    AppBar, Toolbar, Typography, Button, Box, Container,
    IconButton, Tooltip, Menu, MenuItem, Avatar, Badge, Snackbar, Alert
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
    DarkMode as DarkIcon,
    LightMode as LightIcon,
    Add as AddIcon
} from "@mui/icons-material";

import HistoryIcon from '@mui/icons-material/History';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Drawer, List, ListItem, ListItemButton, ListItemText,
         useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import bgLight from './assets/bg-light.jpg';
import bgDark from './assets/bg-dark.jpg';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { io } from 'socket.io-client';
import api from "./services/api";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Page imports
import Home             from "./pages/Home";
import Auctions         from "./pages/Auctions";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import AuctionDetail    from "./pages/AuctionDetail";
import CreateAuction    from "./pages/CreateAuction";
import ProfileDashboard from "./pages/ProfileDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard  from "./pages/BuyerDashboard";
import WatchlistPage   from "./pages/Watchlist";
import AdminCategories from "./pages/AdminCategories";
import Notifications from './pages/Notifications'; 
import IssueReporting from './pages/IssueReporting';
import AdminChat      from './pages/AdminChat';
import UserChat       from './pages/UserChat';
import PaymentPage from './pages/PaymentPage';
import AdminAuctionHistory from './pages/AdminAuctionHistory';
import Footer from "./components/Footer";

// Navigation bar
const Navbar = ({ darkMode, toggleDarkMode }) => {
    const { isAuthenticated, user, logout, isAdmin } = useAuth();
    const navigate  = useNavigate();
    const theme     = useTheme();
    const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
    const [anchorEl,      setAnchorEl]      = useState(null);
    const [drawerOpen,    setDrawerOpen]    = useState(false);
    const [notifCount,    setNotifCount]    = useState(0);
    const [toastOpen,     setToastOpen]     = useState(false);
    const [toastMsg,      setToastMsg]      = useState('');
    const [toastAuction,  setToastAuction]  = useState(null);
    const [toastIssue,    setToastIssue]    = useState(null);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        api.get('/notifications')
            .then(res => {
                const unread = (res.data.data || []).filter(n => !n.isRead);
                setNotifCount(unread.length);
            }).catch(() => {});
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';
        const socket = io(SOCKET_URL);
        socket.emit('authenticate', user._id);
        socket.on('new-notification', (notif) => {
            setNotifCount(prev => prev + 1);
            setToastMsg(notif.message);
            setToastAuction(notif.auction);
            setToastIssue(notif.issueReport || null);
            setToastOpen(true);
        });
        return () => { socket.disconnect(); };
    }, [isAuthenticated, user]);

    const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = ()  => setAnchorEl(null);
    const handleProfile   = ()  => { handleMenuClose(); navigate('/profile'); };
    const handleLogout    = ()  => { handleMenuClose(); logout(); navigate('/'); };

    // Links shown in both desktop nav and mobile drawer
    const navLinks = [
        { label: 'Browse', path: '/auctions', auth: false },
        { label: 'Report an Issue', path: '/issues', auth: true },
        { label: 'Sell', path: '/auctions/create', auth: true },
    ];

    // Mobile drawer content
    const drawer = (
        <Box sx={{ width: 260 }} onClick={() => setDrawerOpen(false)}>
            <Box sx={{ p: 2, bgcolor: 'primary.main' }}>
                <Typography variant='h6' color='white' fontWeight='bold'>
                    🔨 Auction It
                </Typography>
                {user && (
                    <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                        {user.name}
                    </Typography>
                )}
            </Box>
            <List>
                {navLinks.filter(l => !l.auth || isAuthenticated).map(l => (
                    <ListItem key={l.path} disablePadding>
                        <ListItemButton onClick={() => navigate(l.path)}>
                            <ListItemText primary={l.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
                {isAdmin && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/admin/auction-history')}>
                            <ListItemText primary='Auction History' />
                        </ListItemButton>
                    </ListItem>
                )}
                {isAuthenticated && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/notifications')}>
                            <ListItemText
                                primary={`Notifications${notifCount > 0 ? ` (${notifCount})` : ''}`}
                            />
                        </ListItemButton>
                    </ListItem>
                )}
                {isAuthenticated ? (
                    <>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/profile')}>
                                <ListItemText primary='My Profile' />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleLogout}
                                sx={{ color: 'error.main' }}>
                                <ListItemText primary='Logout' />
                            </ListItemButton>
                        </ListItem>
                    </>
                ) : (
                    <>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/login')}>
                                <ListItemText primary='Login' />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/register')}>
                                <ListItemText primary='Register' />
                            </ListItemButton>
                        </ListItem>
                    </>
                )}
            </List>
        </Box>
    );

    return (
        <AppBar position='static' elevation={2}>
            <Toolbar>
                {/* Hamburger — mobile only */}
                {isMobile && (
                    <IconButton color='inherit' edge='start'
                        onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Brand */}
                <Typography variant='h6' component={Link} to='/'
                    sx={{ flexGrow: 1, textDecoration: 'none', color: 'white', fontWeight: 'bold' }}>
                    🔨 Auction It
                </Typography>

                {/* Desktop nav links */}
                {!isMobile && (
                    <>
                        <Button color='inherit' component={Link} to='/auctions'>Browse</Button>
                        {isAuthenticated && (
                            <Button color='inherit' component={Link} to='/issues'
                                sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                Report an Issue
                            </Button>
                        )}
                        {isAdmin && (
                            <Tooltip title='Auction History'>
                                <IconButton color='inherit'
                                    onClick={() => navigate('/admin/auction-history')}
                                    sx={{ mr: 0.5 }}>
                                    <HistoryIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {isAuthenticated && (
                            <Badge badgeContent={notifCount} color='error' sx={{ mr: 1 }}
                                onClick={() => setNotifCount(0)}>
                                <Button color='inherit' component={Link} to='/notifications'
                                    sx={{ minWidth: 'auto' }}>
                                    Notifications
                                </Button>
                            </Badge>
                        )}
                        {isAuthenticated && (
                            <Button color='inherit' component={Link} to='/auctions/create'
                                startIcon={<AddIcon />}
                                sx={{ mx: 1, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2 }}>
                                Sell
                            </Button>
                        )}
                    </>
                )}

                {/* Dark mode toggle — always visible */}
                <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <IconButton color='inherit' onClick={toggleDarkMode}>
                        {darkMode ? <LightIcon /> : <DarkIcon />}
                    </IconButton>
                </Tooltip>

                {/* User menu — desktop only */}
                {!isMobile && isAuthenticated && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        <Tooltip title='View Profile'>
                            <Button color='inherit' onClick={handleMenuOpen}
                                startIcon={
                                    <Avatar sx={{ width: 28, height: 28,
                                        bgcolor: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                }
                            >
                                {user?.username || user?.name}
                            </Button>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            <MenuItem onClick={handleProfile}>My Profile</MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
                        </Menu>
                    </Box>
                )}
                {!isMobile && !isAuthenticated && (
                    <Box>
                        <Button color='inherit' component={Link} to='/login'>Login</Button>
                        <Button color='inherit' component={Link} to='/register'>Register</Button>
                    </Box>
                )}
            </Toolbar>

            {/* Mobile Drawer */}
            <Drawer anchor='left' open={drawerOpen}
                onClose={() => setDrawerOpen(false)}>
                {drawer}
            </Drawer>

            {/* Toast */}
            <Snackbar open={toastOpen} autoHideDuration={10000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                sx={{ mb: 2, ml: 2 }}>
                <Alert onClose={() => setToastOpen(false)} severity='info' variant='filled'
                    sx={{ width: '320px', cursor: toastAuction ? 'pointer' : 'default' }}
                    onClick={() => {
                        if (toastAuction?._id) { navigate(`/auction/${toastAuction._id}`); setToastOpen(false); }
                        else if (toastIssue?._id) {
                            navigate(user?.role === 'admin' ? `/admin/chat/${toastIssue._id}` : `/chat/${toastIssue._id}`);
                            setToastOpen(false);
                        }
                    }}>
                    {toastMsg}
                </Alert>
            </Snackbar>
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

        components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: darkMode
                        ? undefined
                        : undefined,
                    backgroundImage: darkMode
                        ? `
                        linear-gradient(
                            rgba(18, 18, 18, 0.9),
                            rgba(18, 18, 18, 0.9)
                        ),
                        url(${bgDark})`
                        : `
                        linear-gradient(
                            rgba(245, 247, 250, 0.5),
                            rgba(245, 247, 250, 0.5)
                        ),
                        url(${bgLight})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh'
                }
            }
        }
    }
    }), [darkMode]);

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <AuthProvider>
                        <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
};

// Separate component so useNavigate works inside BrowserRouter
const AppContent = ({ darkMode, toggleDarkMode }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Box component='main' sx={{ flexGrow: 1 }}>
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
                    
                    <Route path="/notifications" element={
                        <PrivateRoute><Notifications /></PrivateRoute>
                    } />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" />} />

                    <Route path="/issues" element={
                        <PrivateRoute><IssueReporting /></PrivateRoute>
                    } />
                    <Route path="/admin/chat/:reportId" element={
                        <PrivateRoute><AdminChat /></PrivateRoute>
                    } />
                    <Route path="/chat/:reportId" element={
                        <PrivateRoute><UserChat /></PrivateRoute>
                    } />
                    <Route path="/payment/:auctionId" element={
                        <PrivateRoute><PaymentPage /></PrivateRoute>
                    } />
                    <Route path='/admin/auction-history' element={
                        <PrivateRoute><AdminAuctionHistory /></PrivateRoute>
                    } />
                </Routes>
            </Container>
        </Box>
        <Footer />
        </Box>
    );
};

export default App;
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Paper, Chip,
         CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { loadNotifications(); }, []);

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data || []);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally { setLoading(false); }
    };

    const handleDismiss = async (notifId) => {
        try {
            await api.delete(`/notifications/${notifId}`);
            setNotifications(prev => prev.filter(n => n._id !== notifId));
        } catch (err) {
            console.error('Failed to dismiss:', err);
        }
    };

    if (loading) return <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress /></Container>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Notifications
            </Typography>
            {notifications.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        No notifications yet.
                    </Typography>
                </Paper>
            ) : notifications.map(n => (
                <Paper key={n._id} sx={{ p: 2, mb: 2, display: "flex",
                    justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="body1" fontWeight="medium">
                            {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        {n.auction && (
                            <Button size="small" variant="outlined"
                                onClick={() => navigate(`/auction/${n.auction._id}`)}>
                                View
                            </Button>
                        )}
                        <Button size="small" color="error"
                            onClick={() => handleDismiss(n._id)}>
                            ✕
                        </Button>
                    </Box>
                </Paper>
            ))}
        </Container>
    );
};

export default Notifications;
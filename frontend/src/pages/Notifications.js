import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Paper, chip,
    CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Alert} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

//sprint-4: Moshee-Ur

const RestartDeleteButtons = ({ auctionId, notifId, onDone }) => {
    const navigate = useNavigate();
    const [restartDialog, setRestartDialog] = useState(false);
    const [deleting,      setDeleting]      = useState(false);
    const [restarting,    setRestarting]    = useState(false);
    const [form, setForm] = useState({
        startPrice: "", minIncrement: "1", reservePrice: "",
        startTime: "", endTime: ""
    });
    const [err, setErr] = useState("");

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/auctions/${auctionId}`);
            onDone();
        } catch (e) { setErr("Delete failed"); }
        finally { setDeleting(false); }
    };

    const handleRestart = async () => {
        if (!form.startPrice || !form.startTime || !form.endTime) {
            setErr("All fields required"); return;
        }
        setRestarting(true);
        try {
            await api.put(`/auctions/${auctionId}/restart`, form);
            onDone();
            setRestartDialog(false);
        } catch (e) { setErr(e.response?.data?.message || "Restart failed"); }
        finally { setRestarting(false); }
    };

    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" color="warning"
                onClick={() => setRestartDialog(true)}>
                Restart Auction
            </Button>
            <Button size="small" variant="outlined" color="error"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? "..." : "Delete"}
            </Button>
            <Dialog open={restartDialog} onClose={() => setRestartDialog(false)}
                maxWidth="sm" fullWidth>
                <DialogTitle>List Auction Again</DialogTitle>
                <DialogContent>
                    {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                    {[
                        { label: "Starting Price (BDT)", key: "startPrice", type: "number" },
                        { label: "Min Bid Increment (BDT)", key: "minIncrement", type: "number" },
                        { label: "Reserve Price (BDT, optional)", key: "reservePrice", type: "number" },
                        { label: "Auction Start Time", key: "startTime", type: "datetime-local" },
                        { label: "Auction End Time", key: "endTime", type: "datetime-local" },
                    ].map(f => (
                        <TextField key={f.key} fullWidth label={f.label} type={f.type}
                            value={form[f.key]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestartDialog(false)}>Cancel</Button>
                    <Button onClick={handleRestart} variant="contained" disabled={restarting}>
                        {restarting ? "Restarting..." : "List Auction Again"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};


const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
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
                        {n.auction && n.type !== "payment_failed" && (
                            <Button size="small" variant="outlined"
                                onClick={() => navigate(`/auction/${n.auction._id}`)}>
                                View
                            </Button>
                        )}
                        {n.auction && n.type === "bid_ending" &&
                         n.message?.includes("won") && (
                            <Button size="small" variant="contained" color="success"
                                onClick={() => navigate(`/payment/${n.auction._id}`)}>
                                Pay Now
                            </Button>
                        )}
                        {n.type === "payment_failed" && n.auction && (
                            <RestartDeleteButtons
                                auctionId={n.auction._id}
                                notifId={n._id}
                                onDone={() => setNotifications(prev =>
                                    prev.filter(x => x._id !== n._id))}
                            />
                        )}
                        {n.issueReport && (
                            <Button size="small" variant="outlined" color="warning"
                                onClick={() => {
                                    const path = n.type === 'issue_reported' && user?.role === 'admin'
                                        ? `/admin/chat/${n.issueReport._id}`
                                        : `/chat/${n.issueReport._id}`;
                                    navigate(path);
                                }}>
                                Open Chat
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
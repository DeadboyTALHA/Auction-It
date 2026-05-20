import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Paper,
    Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Alert, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const IssueReporting = () => {
    const navigate  = useNavigate();
    const [dialog,   setDialog]   = useState(false);
    const [message,  setMessage]  = useState("");
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState("");
    const [error,    setError]    = useState("");
    const [myReports, setMyReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);

    useEffect(() => {
        api.get("/issues/my")
           .then(res => setMyReports(res.data.data || []))
           .catch(() => {})
           .finally(() => setLoadingReports(false));
    }, [success]);

    const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

    const handleSubmit = async () => {
        if (!message.trim()) { setError("Please write your issue"); return; }
        if (wordCount > 200) { setError("Maximum 200 words"); return; }
        setLoading(true); setError("");
        try {
            await api.post("/issues", { message });
            setSuccess("Your issue has been successfully reported!");
            setMessage("");
            setDialog(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit report");
        } finally { setLoading(false); }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Issue Reporting</Typography>
                <Button variant="contained" color="error"
                    onClick={() => { setDialog(true); setError(""); setSuccess(""); }}>
                    Report an Issue
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Typography variant="h6" gutterBottom>My Reported Issues</Typography>
            {loadingReports ? <CircularProgress /> : myReports.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">No issues reported yet.</Typography>
                </Paper>
            ) : myReports.map(r => (
                <Paper key={r._id} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center" }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                {new Date(r.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {r.message.slice(0, 80)}{r.message.length > 80 ? "..." : ""}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Chip label={r.status} size="small"
                                color={r.status === "resolved" ? "success" : "warning"} />
                            {(r.status === "in_progress" || r.status === "resolved") ? (
                                <Button size="small" variant="outlined"
                                    onClick={() => navigate(`/chat/${r._id}`)}>
                                    Open Chat
                                </Button>
                            ) : (
                                <Typography variant="caption" color="text.secondary"
                                    sx={{ fontStyle: "italic" }}>
                                    Awaiting admin response
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Paper>
            ))}

            {/* Report Dialog */}
            <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Report Your Issue Here</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        fullWidth multiline rows={6}
                        label="Describe your issue"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        helperText={`${wordCount}/200 words`}
                        error={wordCount > 200}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Report"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default IssueReporting;

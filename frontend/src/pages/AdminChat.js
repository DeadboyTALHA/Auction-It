import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField,
    Button, CircularProgress, Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

const AdminChat = () => {
    const { reportId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [report,   setReport]   = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg,   setNewMsg]   = useState("");
    const [loading,  setLoading]  = useState(true);
    const [sending,  setSending]  = useState(false);
    const [ending,   setEnding]   = useState(false);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [reportsRes, msgsRes] = await Promise.all([
                    api.get("/issues"),
                    api.get(`/issues/${reportId}/messages`)
                ]);
                const found = (reportsRes.data.data || []).find(r => r._id === reportId);
                setReport(found || null);
                setMessages(msgsRes.data.data || []);
            } catch (err) {
                console.error(err);
            } finally { setLoading(false); }
        };
        load();

        // Socket connection
        // Socket connection
        const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('join-chat', reportId);
        socketRef.current.on('new-chat-message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        socketRef.current.on('chat-ended', () => {
            setReport(prev => prev ? { ...prev, status: "ended" } : prev);
        });
        return () => {
            socketRef.current.emit('leave-chat', reportId);
            socketRef.current.disconnect();
        };
    }, [reportId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMsg.trim()) return;
        setSending(true);
        try {
            await api.post(`/issues/${reportId}/messages`, { message: newMsg.trim() });
            setNewMsg("");
        } catch (err) {
            console.error(err);
        } finally { setSending(false); }
    };

    const handleEndChat = async () => {
        setEnding(true);
        try {
            await api.put(`/issues/${reportId}/end`);
            setReport(prev => prev ? { ...prev, status: "ended" } : prev);
        } catch (err) {
            console.error("Failed to end chat:", err);
        } finally { setEnding(false); }
    };

    if (loading) return <Container sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>
            <Box sx={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">
                    Chat With {report?.user?.username || "User"}
                </Typography>
                {report?.status !== "ended" && (
                    <Button variant="outlined" color="error" size="small"
                        onClick={handleEndChat}
                        disabled={ending}
                    >
                        {ending ? "Ending..." : "End Chat"}
                    </Button>
                )}
                {report?.status === "ended" && (
                    <Chip label="Chat Ended" color="error" size="small" />
                )}
            </Box>
            {report && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Original Report:</Typography>
                    <Typography variant="body2">{report.message}</Typography>
                </Paper>
            )}
            <Paper sx={{ p: 2, height: 400, overflowY: "auto", mb: 2 }}>
                {messages.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" sx={{ mt: 10 }}>
                        No messages yet. Start the conversation.
                    </Typography>
                ) : messages.map(m => {
                    const isMe = m.sender?._id === user?._id;
                    return (
                        <Box key={m._id} sx={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            mb: 1.5
                        }}>
                            <Box sx={{
                                maxWidth: "70%", p: 1.5, borderRadius: 2,
                                bgcolor: isMe ? "primary.main" : "action.hover",
                                color:   isMe ? "white" : "text.primary",
                                border: isMe ? "none" : "1px solid",
                                borderColor: "divider"
                            }}>
                                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                    {m.sender?.role === "admin" ? "Admin" : m.sender?.username}
                                </Typography>
                                <Typography variant="body2">{m.message}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>
                                    {new Date(m.createdAt).toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={bottomRef} />
            </Paper>
            {report?.status === "ended" ? (
                <Typography variant="body2" color="error"
                    sx={{ textAlign: "center", py: 1 }}>
                    This chat has been ended.
                </Typography>
            ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField fullWidth size="small" placeholder="Type a message..."
                        value={newMsg} onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault(); handleSend();
                        }}}
                    />
                    <Button variant="contained" onClick={handleSend} disabled={sending}>
                        {sending ? "..." : "Send"}
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default AdminChat;

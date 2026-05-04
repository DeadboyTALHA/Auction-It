import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Button, Chip,
    CircularProgress, TextField, MenuItem, Select,
    InputLabel, FormControl, Table, TableHead, TableBody,
    TableRow, TableCell, TableContainer, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusColor = (s) => {
    if (s === 'active') return 'success';
    if (s === 'sold') return 'primary';
    if (s === 'pending_payment') return 'warning';
    if (s === 'ended') return 'error';
    return 'default';
};

const statusLabel = (s) => {
    const map = {
        active: 'Active', ended: 'Ended',
        sold: 'Sold', pending_payment: 'Payment Pending',
        cancelled: 'Cancelled'
    };
    return map[s] || s;
};

const fmtBDT = (n) => n != null
    ? 'BDT ' + parseFloat(n).toLocaleString('en-BD',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

const fmtDate = (d) => d
    ? new Date(d).toLocaleString('en-BD', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

const AdminAuctionHistory = () => {
    const { isAdmin } = useAuth();
    const navigate    = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [filter,   setFilter]   = useState('all');
    const [search,   setSearch]   = useState('');

    useEffect(() => {
        if (!isAdmin) { navigate('/'); return; }
        loadAll();
    }, [isAdmin]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/auction-history');
            setAuctions(res.data.data || []);
        } catch (e) {
            console.error('Failed to load history:', e);
        } finally { setLoading(false); }
    };

    const filtered = auctions.filter(a => {
        const matchStatus = filter === 'all' || a.status === filter;
        const title = a.item?.title || '';
        const matchSearch = title.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <Container maxWidth='xl' sx={{ py: 3 }}>
            <Typography variant='h4' fontWeight='bold' gutterBottom>
                Admin — Auction History
            </Typography>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField label='Search by title' size='small' value={search}
                    onChange={e => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
                <FormControl size='small' sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filter} label='Status'
                        onChange={e => setFilter(e.target.value)}>
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value='active'>Active</MenuItem>
                        <MenuItem value='ended'>Ended</MenuItem>
                        <MenuItem value='sold'>Sold</MenuItem>
                        <MenuItem value='pending_payment'>Payment Pending</MenuItem>
                        <MenuItem value='cancelled'>Cancelled</MenuItem>
                    </Select>
                </FormControl>
                <Button variant='outlined' onClick={loadAll}>Refresh</Button>
                <Typography variant='body2' color='text.secondary' sx={{ alignSelf: 'center' }}>
                    {filtered.length} auctions
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} sx={{ maxHeight: '72vh' }}>
                    <Table stickyHeader size='small'>
                        <TableHead>
                            <TableRow>
                                {[
                                    'Auction Name','Category','Condition',
                                    'Start Time','End Time',
                                    'Initial Price','Min Increment','Reserve Price',
                                    'Highest Price','# Bids',
                                    'Seller','Highest Bidder','Status','View'
                                ].map(h => (
                                    <TableCell key={h}
                                        sx={{ bgcolor: 'primary.main', color: 'primary.contrastText',
                                             fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((a, i) => (
                                <TableRow key={a._id}
                                    sx={{ bgcolor: i % 2 === 0 ? 'background.paper' : 'action.hover' }}>
                                    <TableCell sx={{ maxWidth: 160, whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <Tooltip title={a.item?.title || ''}><span>{a.item?.title || 'Untitled'}</span></Tooltip>
                                    </TableCell>
                                    <TableCell>{a.category?.name || '—'}</TableCell>
                                    <TableCell>{a.item?.condition || '—'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(a.startTime)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(a.endTime)}</TableCell>
                                    <TableCell>{fmtBDT(a.startPrice)}</TableCell>
                                    <TableCell>{fmtBDT(a.minIncrement)}</TableCell>
                                    <TableCell>{a.reservePrice > 0 ? fmtBDT(a.reservePrice) : 'None'}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                        {fmtBDT(a.finalPrice || a.currentPrice)}
                                    </TableCell>
                                    <TableCell>{a.totalBids || 0}</TableCell>
                                    <TableCell>{a.seller?.name || '—'}</TableCell>
                                    <TableCell>{a.winner?.name || '—'}</TableCell>
                                    <TableCell>
                                        <Chip label={statusLabel(a.status)} size='small'
                                            color={statusColor(a.status)} />
                                    </TableCell>
                                    <TableCell>
                                        <Button size='small' variant='outlined'
                                            onClick={() => navigate(`/auction/${a._id}`)}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default AdminAuctionHistory;
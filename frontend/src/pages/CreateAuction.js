/**
 * Create Auction Page
 * Form for users to list an item for auction
 * Any logged-in user can create an auction
 * Author: Farhan
 */

import React, { useState, useEffect } from "react";
import {
    Container, Paper, Typography, TextField, Button,
    Box, Alert, Grid, MenuItem, Select, FormControl,
    InputLabel, Divider, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const CreateAuction = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState("");
    const [success,    setSuccess]    = useState("");

    const [formData, setFormData] = useState({
        title:        "",
        description:  "",
        condition:    "Good",
        category:     "",
        startPrice:   "",
        minIncrement: "1",
        reservePrice: "",
        startTime:    "",
        endTime:      "",
    });

    // Image Addition
    const [images,        setImages]        = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [imageError,    setImageError]    = useState("");


    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        // Load categories for the dropdown
        api.get("/admin/categories")
            .then(res => setCategories(res.data.data || []))
            .catch(() => {});
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImageError("");
        const files = Array.from(e.target.files);

        if (images.length + files.length > 3) {
            setImageError(`Max 3 images. You already have ${images.length}.`);
            return;
        }
        for (const file of files) {
            const allowed = ["image/jpeg", "image/jpg", "image/png"];
            if (!allowed.includes(file.type)) {
                setImageError("Only PNG, JPG, and JPEG images are allowed");
                return;
            }
            if (file.size > 1 * 1024 * 1024) {
                setImageError(`${file.name} exceeds 1 MB limit`);
                return;
            }
        }
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImages(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.title || !formData.category || !formData.startPrice || !formData.startTime || !formData.endTime) {
            return setError("Please fill in all required fields");
        }
        if (parseFloat(formData.startPrice) <= 0) {
            return setError("Start price must be greater than 0");
        }
        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
            return setError("End time must be after start time");
        }
        // for image add
        if (!formData.title || !formData.category || !formData.startPrice ||
            !formData.startTime || !formData.endTime) {
            return setError("Please fill in all required fields");
        }
        // Add this block directly after:
        if (images.length === 0) {
            setImageError("Please upload at least one image");
            return;
        }

        setLoading(true);
        try {
            // If user is not a seller, we need to temporarily upgrade their ability
            // The backend checks role — if they're 'user', we auto-promote context
            const fd = new FormData();
            fd.append("title",        formData.title);
            fd.append("description",  formData.description || "");
            fd.append("condition",    formData.condition);
            fd.append("startPrice",   formData.startPrice);
            fd.append("minIncrement", formData.minIncrement || "1");
            fd.append("reservePrice", formData.reservePrice || "0");
            fd.append("startTime",    formData.startTime);
            fd.append("endTime",      formData.endTime);
            if (formData.category) fd.append("category", formData.category);
            images.forEach(img => fd.append("images", img));

            const res = await api.post("/auctions", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });


            if (res.data.success) {
                setSuccess("Auction created successfully!");
                setTimeout(() => navigate("/auctions"), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to create auction");
        } finally {
            setLoading(false);
        }
    };

    // Default start and end time helpers
    const now     = new Date();
    const in1hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    List an Item for Auction
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Fill in the details below. You cannot bid on your own auction.
                </Typography>

                {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>

                    {/* Item Details */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        ITEM DETAILS
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth required label="Item Title" name="title"
                                value={formData.title} onChange={handleChange}
                                placeholder="e.g. Vintage IBM ThinkPad Laptop" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={4}
                                label="Description" name="description"
                                value={formData.description} onChange={handleChange}
                                placeholder="Describe your item in detail — condition, features, included accessories..."
                                helperText="Optional — describe condition, features, and what is included" />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Condition</InputLabel>
                                <Select name="condition" value={formData.condition}
                                    onChange={handleChange} label="Condition">
                                    {["New", "Like New", "Good", "Fair", "Poor"].map(c => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel shrink>Category</InputLabel>
                                <Select name="category" value={formData.category}
                                    onChange={handleChange} label="Category"
                                    displayEmpty>
                                    <MenuItem value="" disabled>Select a category</MenuItem>
                                    {categories.map(cat => (
                                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />
                    
                    {/* Images */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        IMAGES (required — min 1, max 3, PNG/JPG/JPEG, max 1 MB each)
                    </Typography>

                    {imageError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{imageError}</Alert>
                    )}

                    {/* Thumbnails */}
                    {imagePreviews.length > 0 && (
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                            {imagePreviews.map((src, idx) => (
                                <Box key={idx} sx={{ position: "relative" }}>
                                    <img src={src} alt={`preview-${idx}`} style={{
                                        width: 100, height: 100, objectFit: "cover",
                                        borderRadius: 6,
                                        border: idx === 0 ? "3px solid #2E75B6" : "2px solid #ccc"
                                    }} />
                                    <Box onClick={() => handleRemoveImage(idx)} sx={{
                                        position: "absolute", top: -6, right: -6,
                                        width: 20, height: 20, bgcolor: "error.main",
                                        color: "white", borderRadius: "50%",
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", cursor: "pointer",
                                        fontSize: 12, fontWeight: "bold", lineHeight: 1
                                    }}>
                                        x
                                    </Box>
                                    {idx === 0 && (
                                        <Typography variant="caption" sx={{
                                            display: "block", textAlign: "center",
                                            color: "primary.main", mt: 0.5
                                        }}>
                                            Cover
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Upload button — hidden when 3 images selected */}
                    {images.length < 3 && (
                        <Button variant="outlined" component="label" sx={{ mb: 1 }}>
                            {images.length === 0 ? "Upload Images *" : `Add More (${images.length}/3)`}
                            <input type="file" hidden multiple
                                accept="image/png,image/jpg,image/jpeg"
                                onChange={handleImageChange} />
                        </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        PNG, JPG or JPEG only. Max 1 MB each. First image is the cover.
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* Pricing */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        PRICING
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth required label="Starting Price (BDT)" name="startPrice"
                                type="number" inputProps={{ min: 0.01, step: 0.01 }}
                                value={formData.startPrice} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Min Bid Increment (BDT)" name="minIncrement"
                                type="number" inputProps={{ min: 0.01, step: 0.01 }}
                                value={formData.minIncrement} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Reserve Price (BDT)" name="reservePrice"
                                type="number" inputProps={{ min: 0, step: 0.01 }}
                                value={formData.reservePrice} onChange={handleChange}
                                helperText="0 means no reserve" />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Timing */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        AUCTION TIMING
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="Start Time" name="startTime"
                                type="datetime-local" value={formData.startTime} onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: toLocal(now) }}
                                helperText="When bidding opens" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="End Time" name="endTime"
                                type="datetime-local" value={formData.endTime} onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                helperText="When bidding closes" />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Quick set duration:
                                </Typography>
                                {[
                                    { label: "1 Day",   days: 1  },
                                    { label: "3 Days",  days: 3  },
                                    { label: "7 Days",  days: 7  },
                                    { label: "14 Days", days: 14 },
                                ].map(({ label, days }) => (
                                    <Button key={label} size="small" variant="outlined"
                                        onClick={() => {
                                            const start = formData.startTime
                                                ? new Date(formData.startTime)
                                                : new Date();
                                            const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
                                            setFormData(prev => ({
                                                ...prev,
                                                startTime: prev.startTime || toLocal(new Date()),
                                                endTime: toLocal(end)
                                            }));
                                        }}>
                                        {label}
                                    </Button>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>

                    <Button fullWidth type="submit" variant="contained" size="large"
                        sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "List Auction"}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateAuction;
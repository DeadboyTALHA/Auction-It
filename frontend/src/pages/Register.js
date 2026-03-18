/**
 * Register Page
 * Form for new users to create an account
 * Author: Talha
 */
import React, { useState } from "react";
import {
    Container, Paper, Typography, TextField, Button,
    Box, Alert, Link as MuiLink, Grid, Divider
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Register = () => {
    const [formData, setFormData] = useState({
        name:            "",
        username:        "",
        email:           "",
        password:        "",
        confirmPassword: "",
        phone:           "",
        street:          "",
        area:            "",
        city:            "",
        postalCode:      "",
        country:         "Bangladesh",
    });
    const [error,   setError]   = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }
        if (formData.password.length < 6) {
            return setError("Password must be at least 6 characters");
        }
        if (!formData.username.match(/^[a-zA-Z0-9_]+$/)) {
            return setError("Username can only contain letters, numbers, and underscores");
        }

        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", {
                name:     formData.name,
                username: formData.username,
                email:    formData.email,
                password: formData.password,
                phone:    formData.phone || undefined,
                address: {
                    street:  formData.street     || undefined,
                    area:    formData.area        || undefined,
                    city:    formData.city        || undefined,
                    zipCode: formData.postalCode  || undefined,
                    country: formData.country     || "Bangladesh",
                }
            });

            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                    Create Your Account
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                    You can buy and sell on Auction It with one account
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        PERSONAL INFORMATION
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="Full Name" name="name"
                                value={formData.name} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="Username" name="username"
                                value={formData.username} onChange={handleChange}
                                helperText="Letters, numbers, underscores only" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth required label="Email Address" name="email" type="email"
                                value={formData.email} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="Password" name="password" type="password"
                                value={formData.password} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="Confirm Password" name="confirmPassword" type="password"
                                value={formData.confirmPassword} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Phone Number" name="phone"
                                value={formData.phone} onChange={handleChange}
                                placeholder="+880 1XXX XXXXXX" />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        ADDRESS (optional)
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Street / House & Road" name="street"
                                value={formData.street} onChange={handleChange}
                                placeholder="e.g. House 12, Road 4" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Area / Thana" name="area"
                                value={formData.area} onChange={handleChange}
                                placeholder="e.g. Dhanmondi, Uttara" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="City / District" name="city"
                                value={formData.city} onChange={handleChange}
                                placeholder="e.g. Dhaka, Chittagong" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Postal Code (optional)" name="postalCode"
                                value={formData.postalCode} onChange={handleChange}
                                placeholder="e.g. 1205" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Country" name="country"
                                value={formData.country} onChange={handleChange} />
                        </Grid>
                    </Grid>

                    <Button fullWidth type="submit" variant="contained"
                        sx={{ mt: 3, py: 1.5 }} disabled={loading} size="large">
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                    Already have an account?{" "}
                    <MuiLink component={Link} to="/login">Login</MuiLink>
                </Typography>
            </Paper>
        </Container>
    );
};

export default Register;
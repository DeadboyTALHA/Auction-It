/**
 * Register Page
 * Form for new users to create an account
 * Author: Talha
 */

import React, { useState } from "react";
import { Container, Paper, Typography, TextField, Button, Box, Alert,
         FormControl, InputLabel, Select, MenuItem, Link as MuiLink } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", confirmPassword: "", role: "user"
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Generic handler for all form fields
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Client-side validation: check passwords match
        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }
        if (formData.password.length < 6) {
            return setError("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
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
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Create Account
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField fullWidth label="Full Name" name="name"
                        value={formData.name} onChange={handleChange} margin="normal" required />
                    <TextField fullWidth label="Email" name="email" type="email"
                        value={formData.email} onChange={handleChange} margin="normal" required />
                    <TextField fullWidth label="Password" name="password" type="password"
                        value={formData.password} onChange={handleChange} margin="normal" required />
                    <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password"
                        value={formData.confirmPassword} onChange={handleChange} margin="normal" required />

                    {/* Role selection: user (buyer) or seller */}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Account Type</InputLabel>
                        <Select name="role" value={formData.role} onChange={handleChange} label="Account Type">
                            <MenuItem value="user">Buyer</MenuItem>
                            <MenuItem value="seller">Seller</MenuItem>
                        </Select>
                    </FormControl>

                    <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
                        {loading ? "Creating account..." : "Register"}
                    </Button>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                    Already have an account? <MuiLink component={Link} to="/login">Login</MuiLink>
                </Typography>
            </Paper>
        </Container>
    );
};

export default Register;

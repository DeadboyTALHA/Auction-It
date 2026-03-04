/**
 * Login Page
 * Form for users to enter email and password
 * Author: Talha
 */

import React, { useState } from "react";
import { Container, Paper, Typography, TextField, Button, Box, Alert, Link as MuiLink } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Login = () => {
    // Form field state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Error message if login fails
    const [error, setError] = useState("");
    // Loading state while API call is in progress
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();   // Get login function from context
    const navigate = useNavigate(); // For redirecting after login

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        setError("");       // Clear previous errors
        setLoading(true);

        try {
            // Call backend login API
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password
            });

            if (response.data.success) {
                // Save user and token in context + localStorage
                login(response.data.user, response.data.token);
                // Redirect to home page
                navigate("/");
            }
        } catch (err) {
            // Show the error message from the backend
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Login to Auction It
                </Typography>

                {/* Show error if login fails */}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth label="Email" type="email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        margin="normal" required
                    />
                    <TextField
                        fullWidth label="Password" type="password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        margin="normal" required
                    />
                    <Button
                        fullWidth type="submit" variant="contained"
                        sx={{ mt: 2 }} disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                    No account? <MuiLink component={Link} to="/register">Register</MuiLink>
                </Typography>
            </Paper>
        </Container>
    );
};

export default Login;

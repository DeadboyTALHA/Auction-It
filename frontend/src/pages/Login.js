/**
 * Login Page
 * Form for users to enter email and password
 * Author: Talha
 */
import React, { useState } from "react";
import {
    Container, Paper, Typography, TextField, Button,
    Box, Alert, Link as MuiLink
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Login = () => {
    const [identifier, setIdentifier] = useState(""); // username or email
    const [password,   setPassword]   = useState("");
    const [error,      setError]      = useState("");
    const [loading,    setLoading]    = useState(false);

    const { login }  = useAuth();
    const navigate   = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                identifier,
                password
            });

            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                    Login to Auction It
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username or Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        margin="normal"
                        required
                        autoComplete="username"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        autoComplete="current-password"
                    />
                    <Button
                        fullWidth type="submit" variant="contained"
                        sx={{ mt: 2, py: 1.5 }} disabled={loading} size="large"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Box>

                <Typography align="center" sx={{ mt: 2 }}>
                    No account?{" "}
                    <MuiLink component={Link} to="/register">Register</MuiLink>
                </Typography>
            </Paper>
        </Container>
    );
};

export default Login;
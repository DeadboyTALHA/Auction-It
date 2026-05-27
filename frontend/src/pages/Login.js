/**
 * Login Page
 * Form for users to enter email and password
 * Author: Talha
 */
import React, { useState } from "react";
import {
    Container, Paper, Typography, TextField, Button,
    Box, Alert, Link as MuiLink,
    IconButton, InputAdornment
} from "@mui/material";
import Visibility    from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [identifier, setIdentifier] = useState(""); // username or email
    const [password,   setPassword]   = useState("");
    const [error,      setError]      = useState("");
    const [loading,    setLoading]    = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login }  = useAuth();
    const navigate   = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
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

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/google`,
                { credential: credentialResponse.credential }
            );
            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 },
                mt: { xs: 2, sm: 8 } }}>
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
                        label='Password'
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin='normal'
                        required
                        autoComplete='current-password'
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        onClick={() => setShowPassword(prev => !prev)}
                                        edge='end'
                                        aria-label='toggle password visibility'
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                                        <Button
                        fullWidth type="submit" variant="contained"
                        sx={{ mt: 2, py: 1.5 }} disabled={loading} size="large"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Box>

                {/* Divider */}
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    <Typography variant='body2' color='text.secondary' sx={{ mx: 2 }}>
                        or
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                </Box>

                {/* Google Sign-In */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google login failed. Please try again.')}
                        text='signin_with'
                        shape='rectangular'
                        width='320'
                    />
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
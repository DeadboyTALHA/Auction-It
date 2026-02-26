import React from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EndingSoon from '../components/EndingSoon';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <Container maxWidth="lg">
            {/* Hero Section */}
            <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 2,
                mt: 2
            }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to Auction It
                </Typography>
                <Typography variant="h5" sx={{ mb: 4 }}>
                    Bid on unique items or sell your own treasures
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/auctions')}
                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                    >
                        Browse Auctions
                    </Button>
                    {!isAuthenticated && (
                        <Button 
                            variant="outlined" 
                            size="large"
                            onClick={() => navigate('/register')}
                            sx={{ color: 'white', borderColor: 'white' }}
                        >
                            Get Started
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Ending Soon Section */}
            <EndingSoon />
        </Container>
    );
};

export default Home;

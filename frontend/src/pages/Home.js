import React from 'react';
import {
    Container,
    Typography,
    Box,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    return (
        <Container maxWidth="lg">
            {/* Hero Section */}
            <Box sx={{
                textAlign: 'center',
                py: { xs: 4, md: 8 },
                px: { xs: 2, md: 4 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 2,
                mt: 2
            }}>
                <Typography variant='h2' gutterBottom
                    sx={{ fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' } }}>
                    Welcome to Auction It
                </Typography>
                <Typography variant='h5' sx={{ mb: 4,
                    fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                    Bid on unique items or sell your own treasures
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center',
                    flexWrap: 'wrap' }}>
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
        </Container>
    );
};

export default Home;

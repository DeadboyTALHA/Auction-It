import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Grid, Divider, IconButton, Tooltip } from '@mui/material';
import { Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
    const year = new Date().getFullYear();

    const developers = [
        'Md. Minhazul Mowla',
        'Moshee-Ur Rahman',
        'Farhan Ahmed',
        'Md. Rakib Hasan',
    ];

    const quickLinks = [
        { label: 'Browse Auctions', path: '/auctions' },
        { label: 'How It Works',    path: '/' },
        { label: 'FAQ',             path: '/' },
        { label: 'Terms & Conditions', path: '/' },
        { label: 'Privacy Policy',  path: '/' },
    ];

    const footerBg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

    return (
        <Box
            component='footer'
            sx={{
                background: footerBg,
                borderTop: '1px solid rgba(0, 217, 255, 0.15)',
                boxShadow: '0 -4px 20px rgba(0, 217, 255, 0.05)',
                color: '#ccc',
                mt: 'auto',
                pt: { xs: 4, md: 5 },
                pb: 2,
            }}
        >
            <Box sx={{
                maxWidth: '1280px',
                mx: 'auto',
                px: { xs: 2, sm: 4, md: 6 },
            }}>
                <Grid container spacing={4}>

                    {/* Brand + Tagline */}
                    <Grid item xs={12} md={3}>
                        <Typography variant='h5' fontWeight='bold'
                            sx={{ color: '#fff', mb: 1 }}>
                            🔨 Auction It
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#aaa', lineHeight: 1.8 }}>
                            A real-time online auction platform built with the MERN stack.
                            Bid, sell, and connect.  
                        </Typography>
                        <Typography variant='caption' sx={{ color: '#777', mt: 1, display: 'block' }}>
                            CSE 470 — Software Engineering
                        </Typography>
                    </Grid>

                    {/* Developers */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='subtitle1' fontWeight='bold'
                            sx={{ color: '#fff', mb: 2, letterSpacing: 0.5 }}>
                            Developers
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'column' },
                            flexWrap: 'wrap',
                            gap: { xs: 1, sm: 0.5 },
                        }}>
                            {developers.map(name => (
                                <Typography key={name} variant='body2'
                                    sx={{
                                        color: '#ccc',
                                        fontWeight: 500,
                                        mb: { xs: 0, sm: 0.5 },
                                        mr: { xs: 1.5, sm: 0 },
                                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: '#00d9ff' },
                                    }}>
                                    {name}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>

                    {/* Quick Links */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='subtitle1' fontWeight='bold'
                            sx={{ color: '#fff', mb: 2, letterSpacing: 0.5 }}>
                            Quick Links
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            {quickLinks.map(link => (
                                <Typography
                                    key={link.label}
                                    component={Link}
                                    to={link.path}
                                    variant='body2'
                                    sx={{
                                        color: '#aaa',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: '#00d9ff' },
                                    }}
                                >
                                    {link.label}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>

                    {/* Contact + Social */}
                    <Grid item xs={12} md={3}>
                        <Typography variant='subtitle1' fontWeight='bold'
                            sx={{ color: '#fff', mb: 2, letterSpacing: 0.5 }}>
                            Contact Support
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: '#00d9ff' }} />
                                <Typography variant='body2' sx={{ color: '#aaa' }}>
                                    +880 1841470417
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 16, color: '#00d9ff' }} />
                                <Typography variant='body2'
                                    component='a'
                                    href='mailto:md.minhazul.mowla@gmail.com'
                                    sx={{
                                        color: '#aaa', textDecoration: 'none',
                                        '&:hover': { color: '#00d9ff' }
                                    }}>
                                    md.minhazul.mowla@gmail.com
                                </Typography>
                            </Box>
                        </Box>

                        {/* Social */}
                        <Typography variant='subtitle2'
                            sx={{ color: '#fff', mt: 2.5, mb: 1 }}>
                            Follow Us
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='LinkedIn'>
                                <IconButton
                                    component='a'
                                    href='https://www.linkedin.com/in/md-minhazul-mowla/'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    size='small'
                                    sx={{
                                        color: '#aaa',
                                        '&:hover': { color: '#0077b5', bgcolor: 'rgba(0,119,181,0.1)' }
                                    }}
                                >
                                    <LinkedInIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>

                {/* Divider + Copyright */}
                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
                <Typography variant='body2' align='center'
                    sx={{ color: '#666', pb: 1 }}>
                    © {year} Auction It  ·  CSE470: Software Engineering Project — All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default Footer;

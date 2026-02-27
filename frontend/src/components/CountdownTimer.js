/**
 * Countdown Timer Component
 * Displays time remaining for auction
 * Automatically detects expired auctions
 * Author: Farhan
 * Date: Sprint 1
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    HourglassEmpty as HourglassIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const CountdownTimer = ({ endTime, onExpire, size = 'medium' }) => {
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    // Format time function
    const formatTime = (ms) => {
        if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        return { days, hours, minutes, seconds, total: ms };
    };

    // Format display string
    const formatDisplay = (time) => {
        if (time.days > 0) {
            return `${time.days}d ${time.hours}h ${time.minutes}m`;
        } else if (time.hours > 0) {
            return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
        } else if (time.minutes > 0) {
            return `${time.minutes}m ${time.seconds}s`;
        } else {
            return `${time.seconds}s`;
        }
    };

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const remaining = end - now;

            if (remaining <= 0) {
                if (!isExpired) {
                    setIsExpired(true);
                    if (onExpire) onExpire();
                }
                setTimeRemaining(formatTime(0));
            } else {
                setIsExpired(false);
                setTimeRemaining(formatTime(remaining));
            }
        };

        // Calculate immediately
        calculateTimeRemaining();

        // Update every second
        const timer = setInterval(calculateTimeRemaining, 1000);

        // Cleanup
        return () => clearInterval(timer);
    }, [endTime, onExpire]);

    if (!timeRemaining) return null;

    // Determine urgency class
    const isEndingSoon = timeRemaining.total > 0 && timeRemaining.total < 3600000; // 1 hour
    const isVeryUrgent = timeRemaining.total > 0 && timeRemaining.total < 300000; // 5 minutes

    // Size styles
    const sizeStyles = {
        small: {
            fontSize: '0.875rem',
            padding: '4px 8px'
        },
        medium: {
            fontSize: '1rem',
            padding: '8px 12px'
        },
        large: {
            fontSize: '1.25rem',
            padding: '12px 16px'
        }
    };

    if (isExpired) {
        return (
            <Chip
                icon={<WarningIcon />}
                label="Auction Ended"
                color="error"
                size={size === 'small' ? 'small' : 'medium'}
                sx={{ fontWeight: 'bold' }}
            />
        );
    }

    return (
        <Box>
            {isVeryUrgent ? (
                <Chip
                    icon={<WarningIcon />}
                    label={`Ending in ${formatDisplay(timeRemaining)}`}
                    color="error"
                    sx={{ 
                        fontWeight: 'bold',
                        animation: 'pulse 1s infinite',
                        '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                            '100%': { opacity: 1 }
                        }
                    }}
                />
            ) : isEndingSoon ? (
                <Chip
                    icon={<HourglassIcon />}
                    label={`Ending in ${formatDisplay(timeRemaining)}`}
                    color="warning"
                />
            ) : (
                <Chip
                    icon={<TimeIcon />}
                    label={formatDisplay(timeRemaining)}
                    variant="outlined"
                />
            )}
        </Box>
    );
};

export default CountdownTimer;
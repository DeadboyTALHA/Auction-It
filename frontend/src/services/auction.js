/**
 * Auction Service
 * Handles all auction-related API calls
 * Author: Farhan
 * Date: Sprint 1
 */

import api from './api';

const auctionService = {
    // Browse auctions with filters
    browseAuctions: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            
            // Add all params to query string
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== '') {
                    queryParams.append(key, params[key]);
                }
            });
            
            const response = await api.get(`/auctions/browse?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Search auctions
    searchAuctions: async (query, page = 1) => {
        try {
            const response = await api.get(`/auctions/search?q=${encodeURIComponent(query)}&page=${page}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get ending soon auctions
    getEndingSoon: async () => {
        try {
            const response = await api.get('/auctions/ending-soon');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single auction
    getAuctionById: async (id) => {
        try {
            const response = await api.get(`/auctions/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default auctionService;
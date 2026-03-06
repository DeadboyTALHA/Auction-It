/**
 * Auction Service
 * All API calls related to auctions
 * Author: Farhan
 */

import axios from "axios";

// Base URL for auction API
const BASE_URL = "http://localhost:5000/api/auctions";

// Helper: get auth headers with stored token
const getAuthHeaders = () => {
    const token = localStorage.getItem("auction_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const auctionService = {
    // Fetch all active auctions with optional filters
    browseAuctions: async (params = {}) => {
        const response = await axios.get(`${BASE_URL}/browse`, { params });
        return response.data;
    },

    // Search auctions by keyword
    searchAuctions: async (query, page = 1) => {
        const response = await axios.get(`${BASE_URL}/search`, { params: { q: query, page } });
        return response.data;
    },

    // Get auctions ending within the next hour
    getEndingSoon: async () => {
        const response = await axios.get(`${BASE_URL}/ending-soon`);
        return response.data;
    },

    // Create a new auction (sellers only)
    createAuction: async (formData) => {
        const response = await axios.post(BASE_URL, formData, {
            headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    // Get current seller's auctions
    getMyAuctions: async () => {
        const response = await axios.get(`${BASE_URL}/my-auctions`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default auctionService;

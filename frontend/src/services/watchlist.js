//Farhan sprint 2

import api from "./api";

export const getWatchlist = async () => {
    const res = await api.get("/watchlist");
    return res.data;
};

export const addToWatchlist = async (auctionId) => {
    const res = await api.post(`/watchlist/${auctionId}`);
    return res.data;
};

export const removeFromWatchlist = async (auctionId) => {
    const res = await api.delete(`/watchlist/${auctionId}`);
    return res.data;
};


//Farhan end
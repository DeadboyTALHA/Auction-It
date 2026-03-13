//Farhan sprint 2

import api from "./api";

export const getSellerAuctions = async () => {
    const res = await api.get("/seller/auctions");
    return res.data;
};

export const getAuctionBids = async (auctionId) => {
    const res = await api.get(`/seller/auction/${auctionId}/bids`);
    return res.data;
};

//Farhan end
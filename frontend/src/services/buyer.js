//Farhan sprint 2

import api from "./api";

export const getMyBids = async () => {
    const res = await api.get("/buyer/bids");
    return res.data;
};

export const getWonAuctions = async () => {
    const res = await api.get("/buyer/won-auctions");
    return res.data;
};

//Farhan end
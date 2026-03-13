//Farhan sprint 2

import React, { useState, useEffect } from "react";
import { getSellerAuctions, getAuctionBids } from "../services/seller";

const SellerDashboard = () => {
    const [data, setData]       = useState({ stats: {}, auctions: [] });
    const [bids, setBids]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    useEffect(() => {
        getSellerAuctions()
            .then(res => setData({ stats: res.stats, auctions: res.data }))
            .catch(() => setError("Failed to load dashboard"))
            .finally(() => setLoading(false));
    }, []);

    const viewBids = async (auctionId) => {
        try {
            const res = await getAuctionBids(auctionId);
            setBids(res);
        } catch {
            alert("Could not load bids");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error)   return <p style={{ color: "red" }}>{error}</p>;

    const s = data.stats || {};

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
            <h1>Seller Dashboard</h1>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
                {[
                    { label: "Total Auctions", value: s.total || 0, color: "#2E75B6" },
                    { label: "Active",         value: s.active || 0, color: "#27AE60" },
                    { label: "Pending",        value: s.pending || 0, color: "#E67E22" },
                    { label: "Ended/Sold",     value: s.ended || 0, color: "#8E44AD" },
                    { label: "Total Bids",     value: s.totalBids || 0, color: "#C0392B" },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: "#f5f7fa", borderRadius: "8px", padding: "16px 24px",
                        textAlign: "center", borderTop: `4px solid ${stat.color}`, flex: "1 1 120px"
                    }}>
                        <div style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Auctions Table */}
            <h2>My Auctions</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#1B3A6B", color: "#fff" }}>
                        {["Title", "Status", "Current Price", "Total Bids", "Ends", "Actions"].map(h => (
                            <th key={h} style={{ padding: "10px", textAlign: "left" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.auctions.map((a, i) => (
                        <tr key={a._id} style={{ background: i % 2 === 0 ? "#fff" : "#f5f7fa" }}>
                            <td style={{ padding: "10px" }}>{a.item?.title || "—"}</td>
                            <td style={{ padding: "10px" }}><span style={{
                                background: a.status === "active" ? "#27AE60" : "#999",
                                color: "#fff", padding: "2px 8px", borderRadius: "3px", fontSize: "12px"
                            }}>{a.status}</span></td>
                            <td style={{ padding: "10px" }}>${a.currentPrice}</td>
                            <td style={{ padding: "10px" }}>{a.totalBids}</td>
                            <td style={{ padding: "10px" }}>{new Date(a.endTime).toLocaleDateString()}</td>
                            <td style={{ padding: "10px" }}>
                                <button onClick={() => viewBids(a._id)}
                                    style={{ padding: "4px 12px", cursor: "pointer" }}>
                                    View Bids
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Bid Detail Panel */}
            {bids && (
                <div style={{ marginTop: "32px", background: "#f5f7fa", padding: "24px", borderRadius: "8px" }}>
                    <h3>Bids for: {bids.auction?.title}</h3>
                    <p>Total Bids: {bids.bidStats?.totalBids} | Highest: ${bids.bidStats?.highestBid} | Unique Bidders: {bids.bidStats?.uniqueBidders}</p>
                    {bids.data?.map((bid, i) => (
                        <div key={bid._id} style={{ padding: "8px 0", borderBottom: "1px solid #ddd" }}>
                            <strong>#{i + 1}</strong> {bid.bidder?.name} — ${bid.amount}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;


//Farhan end
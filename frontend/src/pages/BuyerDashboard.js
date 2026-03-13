//Farhan sprint 2

import React, { useState, useEffect } from "react";
import { getMyBids, getWonAuctions } from "../services/buyer";

const BuyerDashboard = () => {
    const [bids, setBids]           = useState({ stats: {}, data: [] });
    const [won, setWon]             = useState({ totalSpent: 0, data: [] });
    const [activeTab, setActiveTab] = useState("bids");
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([getMyBids(), getWonAuctions()])
            .then(([bidsRes, wonRes]) => {
                setBids({ stats: bidsRes.stats, data: bidsRes.data });
                setWon({ totalSpent: wonRes.totalSpent, data: wonRes.data });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
            <h1>Buyer Dashboard</h1>

            {/* Stats */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                {[
                    { label: "Total Bids Placed", value: bids.stats?.totalBids || 0, color: "#2E75B6" },
                    { label: "Active Bids",       value: bids.stats?.activeBids || 0, color: "#27AE60" },
                    { label: "Auctions Won",      value: won.data?.length || 0, color: "#8E44AD" },
                    { label: "Total Spent",       value: `$${won.totalSpent || 0}`, color: "#C0392B" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: "#f5f7fa", borderRadius: "8px", padding: "16px 24px",
                        textAlign: "center", borderTop: `4px solid ${s.color}`, flex: "1 1 120px"
                    }}>
                        <div style={{ fontSize: "28px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {["bids", "won"].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "8px 20px", cursor: "pointer",
                            background: activeTab === tab ? "#2E75B6" : "#ddd",
                            color: activeTab === tab ? "#fff" : "#333",
                            border: "none", borderRadius: "4px"
                        }}>
                        {tab === "bids" ? "My Bid History" : "Auctions Won"}
                    </button>
                ))}
            </div>

            {/* Bids Tab */}
            {activeTab === "bids" && (
                <div>
                    {bids.data.length === 0 ? <p>No bids yet.</p> :
                        bids.data.map((bid, i) => (
                            <div key={bid._id} style={{
                                padding: "12px", marginBottom: "8px",
                                background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                                borderRadius: "6px", border: "1px solid #eee"
                            }}>
                                <strong>{bid.auction?.item?.title || "Auction"}</strong>
                                <span style={{ marginLeft: "16px", color: "#2E75B6" }}>Your bid: ${bid.amount}</span>
                                <span style={{ marginLeft: "16px", fontSize: "12px", color: "#999" }}>
                                    Status: {bid.auction?.status}
                                </span>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* Won Tab */}
            {activeTab === "won" && (
                <div>
                    {won.data.length === 0 ? <p>No won auctions yet.</p> :
                        won.data.map((a, i) => (
                            <div key={a._id} style={{
                                padding: "12px", marginBottom: "8px",
                                background: "#F0FFF4", borderRadius: "6px", border: "1px solid #A9DFBF"
                            }}>
                                <strong>{a.item?.title}</strong>
                                <span style={{ marginLeft: "16px", color: "#27AE60" }}>
                                    Final Price: ${a.finalPrice || a.currentPrice}
                                </span>
                                <span style={{ marginLeft: "16px", fontSize: "12px", color: "#666" }}>
                                    Seller: {a.seller?.name}
                                </span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
};

export default BuyerDashboard;


//Farhan end
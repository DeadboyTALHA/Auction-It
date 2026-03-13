//Farhan sprint 2

import React, { useState, useEffect } from "react";
import api from "../services/api";

const FeaturedAuctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/admin/auctions/featured")
            .then(res => setAuctions(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading featured auctions...</p>;
    if (!auctions.length) return null;

    return (
        <section style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#1B3A6B" }}>Featured Auctions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "16px" }}>
                {auctions.map(auction => (
                    <div key={auction._id} style={{
                        border: "2px solid #F39C12", borderRadius: "8px",
                        padding: "12px", background: "#FFFBF0"
                    }}>
                        <span style={{ fontSize: "10px", background: "#F39C12", color: "#fff", padding: "2px 6px", borderRadius: "3px" }}>
                            FEATURED
                        </span>
                        <h4 style={{ margin: "8px 0 4px" }}>{auction.item?.title || "Auction"}</h4>
                        <p style={{ color: "#666", fontSize: "14px" }}>Current Bid: ${auction.currentPrice}</p>
                        <p style={{ color: "#666", fontSize: "12px" }}>
                            Ends: {new Date(auction.endTime).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeaturedAuctions;


//Farhan end
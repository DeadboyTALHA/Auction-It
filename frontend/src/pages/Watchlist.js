//Farhan sprint 2

import React, { useState, useEffect } from "react";
import { getWatchlist, removeFromWatchlist } from "../services/watchlist";

const WatchlistPage = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        getWatchlist()
            .then(res => setItems(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleRemove = async (auctionId) => {
        try {
            await removeFromWatchlist(auctionId);
            setItems(prev => prev.filter(i => i.auction._id !== auctionId));
        } catch {
            alert("Could not remove from watchlist");
        }
    };

    if (loading) return <p>Loading watchlist...</p>;

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
            <h1>My Watchlist ({items.length})</h1>
            {items.length === 0 ? <p>Your watchlist is empty.</p> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "16px" }}>
                    {items.map(item => {
                        const a = item.auction;
                        return (
                            <div key={item._id} style={{
                                border: "1px solid #ddd", borderRadius: "8px",
                                padding: "16px", background: "#fff"
                            }}>
                                <h4>{a?.item?.title || "Auction"}</h4>
                                <p style={{ color: "#2E75B6" }}>Current: ${a?.currentPrice}</p>
                                <p style={{ fontSize: "12px", color: "#999" }}>
                                    Bids: {a?.totalBids} | Status: {a?.status}
                                </p>
                                <p style={{ fontSize: "12px", color: "#999" }}>
                                    Ends: {new Date(a?.endTime).toLocaleDateString()}
                                </p>
                                <button onClick={() => handleRemove(a._id)}
                                    style={{
                                        marginTop: "8px", padding: "4px 12px",
                                        background: "#C0392B", color: "#fff",
                                        border: "none", borderRadius: "4px", cursor: "pointer"
                                    }}>
                                    Remove
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;


//Farhan end
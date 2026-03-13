//Farhan Sprint 2

import React, { useState, useEffect } from "react";
import { getAllCategories } from "../services/category";

const FilterBar = ({ onFilter }) => {
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: "",
        minPrice: "",
        maxPrice: "",
        endingSoon: false
    });

    useEffect(() => {
        getAllCategories().then(res => setCategories(res.data || [])).catch(console.error);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleApply = () => onFilter(filters);

    const handleClear = () => {
        const reset = { category: "", minPrice: "", maxPrice: "", endingSoon: false };
        setFilters(reset);
        onFilter(reset);
    };

    return (
        <div style={{ background: "#f5f7fa", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "12px" }}>Filter Auctions</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>

                {/* Category */}
                <div>
                    <label>Category</label><br/>
                    <select name="category" value={filters.category} onChange={handleChange}
                        style={{ padding: "6px", minWidth: "140px" }}>
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Min Price */}
                <div>
                    <label>Min Price ($)</label><br/>
                    <input type="number" name="minPrice" value={filters.minPrice}
                        onChange={handleChange} placeholder="0"
                        style={{ padding: "6px", width: "100px" }} />
                </div>

                {/* Max Price */}
                <div>
                    <label>Max Price ($)</label><br/>
                    <input type="number" name="maxPrice" value={filters.maxPrice}
                        onChange={handleChange} placeholder="9999"
                        style={{ padding: "6px", width: "100px" }} />
                </div>

                {/* Ending Soon */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" name="endingSoon" id="endingSoon"
                        checked={filters.endingSoon} onChange={handleChange} />
                    <label htmlFor="endingSoon">Ending Soon (24h)</label>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleApply}
                        style={{ padding: "6px 16px", background: "#2E75B6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Apply
                    </button>
                    <button onClick={handleClear}
                        style={{ padding: "6px 16px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;

//Farhan end
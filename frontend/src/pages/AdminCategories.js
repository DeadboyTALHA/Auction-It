//Farhan sprint 2

import React, { useState, useEffect } from "react";
import { getAllCategories, createCategory, deleteCategory } from "../services/category";

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [form, setForm]             = useState({ name: "", description: "", icon: "" });
    const [msg, setMsg]               = useState("");

    const load = () => getAllCategories().then(res => setCategories(res.data || []));

    useEffect(() => { load(); }, []);

    const handleSubmit = async () => {
        if (!form.name) return setMsg("Name is required");
        try {
            await createCategory(form);
            setMsg("Category created!");
            setForm({ name: "", description: "", icon: "" });
            load();
        } catch (e) {
            setMsg(e.response?.data?.message || "Error creating category");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(c => c._id !== id));
        } catch {
            alert("Could not delete category");
        }
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
            <h1>Manage Categories</h1>

            {/* Create Form */}
            <div style={{ background: "#f5f7fa", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                <h3>Add New Category</h3>
                {msg && <p style={{ color: msg.includes("!") ? "green" : "red" }}>{msg}</p>}
                <input placeholder="Name *" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={{ display: "block", marginBottom: "8px", padding: "8px", width: "100%" }} />
                <input placeholder="Description" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ display: "block", marginBottom: "8px", padding: "8px", width: "100%" }} />
                <input placeholder="Icon (e.g. laptop)" value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    style={{ display: "block", marginBottom: "8px", padding: "8px", width: "100%" }} />
                <button onClick={handleSubmit}
                    style={{ padding: "8px 24px", background: "#2E75B6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Create Category
                </button>
            </div>

            {/* Categories List */}
            <h3>Existing Categories ({categories.length})</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#1B3A6B", color: "#fff" }}>
                    {["Name", "Slug", "Description", "Action"].map(h => (
                        <th key={h} style={{ padding: "10px", textAlign: "left" }}>{h}</th>
                    ))}
                </tr></thead>
                <tbody>
                    {categories.map((c, i) => (
                        <tr key={c._id} style={{ background: i % 2 === 0 ? "#fff" : "#f5f7fa" }}>
                            <td style={{ padding: "10px" }}>{c.name}</td>
                            <td style={{ padding: "10px", color: "#666" }}>{c.slug}</td>
                            <td style={{ padding: "10px", color: "#666" }}>{c.description || "—"}</td>
                            <td style={{ padding: "10px" }}>
                                <button onClick={() => handleDelete(c._id)}
                                    style={{ padding: "4px 12px", background: "#C0392B", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminCategories;


//Farhan end
/**
 * Category Model
 * Admin-managed auction categories
 * Author: Talha | Sprint 2
 */
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true
    },
    description: { type: String, default: "" },
    icon:        { type: String, default: "" },
    isActive:    { type: Boolean, default: true },
    displayOrder:{ type: Number, default: 0 }
}, { timestamps: true });

categorySchema.index({ slug: 1 });

module.exports = mongoose.model("Category", categorySchema);

/**
 * Category Controller
 * Handles CRUD operations for auction categories
 * Author: Talha
 * Sprint: 2
 */

const Category = require("../models/Category");

// @desc   Create a new category
// @route  POST /api/admin/categories
// @access Admin only
const createCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ success: false, message: "Category with this name already exists" });
        }
        const category = await Category.create({ name, slug, description, icon, isActive: true });
        res.status(201).json({ success: true, message: "Category created", data: category });
    } catch (error) {
        console.error("createCategory error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Get all categories
// @route  GET /api/admin/categories
// @access Public
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Update a category
// @route  PUT /api/admin/categories/:id
// @access Admin only
const updateCategory = async (req, res) => {
    try {
        const { name, description, icon, isActive } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        if (name) {
            category.name = name;
            category.slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        }
        if (description !== undefined) category.description = description;
        if (icon !== undefined) category.icon = icon;
        if (isActive !== undefined) category.isActive = isActive;
        await category.save();
        res.json({ success: true, message: "Category updated", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Delete a category
// @route  DELETE /api/admin/categories/:id
// @access Admin only
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        await category.deleteOne();
        res.json({ success: true, message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { createCategory, getAllCategories, updateCategory, deleteCategory };

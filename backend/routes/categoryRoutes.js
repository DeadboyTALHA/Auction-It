/**
 * Category Routes
 * Author: Talha | Sprint 2
 */
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

// Public — anyone can read categories (needed for browsing/filtering)
router.get("/", getAllCategories);

// Admin only — create, update, delete
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;

/**
 * Image Upload Middleware
 * Handles file uploads for auction images
 * Author: Rakib
 * Date: Sprint 1
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6)
                         + path.extname(file.originalname).toLowerCase();
        cb(null, uniqueName);
    }
});

// Only allow PNG, JPG, JPEG
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PNG, JPG, and JPEG images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024,  // 1 MB per file
        files: 3                     // maximum 3 images
    }
});

// Export middleware — accepts up to 3 images under field name 'images'
exports.handleImageUpload = upload.array('images', 3);

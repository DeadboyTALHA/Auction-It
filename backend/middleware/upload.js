const multer = require('multer');
const { storage: cloudinaryStorage } = require('../config/cloudinary');

const upload = multer({
    storage: cloudinaryStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024,  // 5 MB per file
        files: 3                     // maximum 3 images
    },
    fileFilter: (req, file, cb) => {       
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Image file format ${file.mimetype} not allowed. Only JPG, PNG, and WEBP are allowed`), false);
        }
    }
});

// Export middleware — accepts up to 3 images under field name 'images'
exports.handleImageUpload = upload.array('images', 3);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'video/mp4': true,
    'video/mpeg': true,
    'video/quicktime': true,
    'video/x-msvideo': true, // .avi
    'audio/mpeg': true, // .mp3
    'audio/wav': true,
    'audio/ogg': true,
    'audio/mp4': true, // .m4a
    'audio/x-m4a': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images, videos, and audio files are allowed.`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for handling multiple files
const uploadMultiple = upload.array('media', 10);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 50MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum 10 files per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field name. Use "media" for file uploads.'
      });
    }
  }
  
  if (error && error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: error.message
    });
  }
  
  // Skip error if no actual error or if it's just middleware flow
  if (!error) {
    return next();
  }
  
  next(error);
};

// Helper function to get file URL
const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Helper function to process uploaded files
const processUploadedFiles = (req, files) => {
  if (!files || files.length === 0) {
    return [];
  }
  
  return files.map(file => ({
    type: file.mimetype.startsWith('image/') ? 'image' : 
          file.mimetype.startsWith('video/') ? 'video' : 'audio',
    url: getFileUrl(req, file.filename),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  }));
};

module.exports = {
  uploadMultiple,
  handleUploadError,
  getFileUrl,
  processUploadedFiles
};

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  analyzeScan,
  uploadScan,
  getMyScans,
} = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `scan-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must be less than 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  return next();
};

const router = express.Router();

/**
 * @route   POST /api/scans/analyze
 * @desc    Analyze image via AI service and return disease info (no auth required)
 * @access  Public
 */
router.post(
  '/analyze',
  upload.single('image'),
  handleMulterError,
  analyzeScan
);

/**
 * @route   POST /api/scans
 * @desc    Analyze image and save scan history for authenticated user
 * @access  Private
 */
router.post('/', protect, upload.single('image'), handleMulterError, uploadScan);

/**
 * @route   GET /api/scans
 * @desc    Retrieve authenticated user's scan history
 * @access  Private
 */
router.get('/', protect, getMyScans);

module.exports = router;

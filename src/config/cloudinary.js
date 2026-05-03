const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const ApiError = require('../utils/ApiError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const uploadSingle = (fieldName = 'image') => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      return next(ApiError.badRequest('File upload failed: ' + err.message));
    }
    next();
  });
};

module.exports = { cloudinary, upload, uploadSingle };
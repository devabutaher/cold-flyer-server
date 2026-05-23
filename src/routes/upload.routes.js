const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'coldflyer',
  });

  res.status(200).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});

router.post('/', authenticate, upload.single('image'), uploadImage);

module.exports = router;
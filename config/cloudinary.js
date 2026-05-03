const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.default || multerStorageCloudinary;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'coldflyer',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
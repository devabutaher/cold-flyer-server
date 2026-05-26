const { cloudinary } = require("../config/cloudinary");

async function uploadGoogleAvatar(imageUrl) {
  if (!imageUrl) return null;
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "coldflyer/avatars",
    });
    return result.secure_url;
  } catch {
    return null;
  }
}

module.exports = { uploadGoogleAvatar };

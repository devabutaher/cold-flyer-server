const { upload } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

const uploadImage = (fieldName = "image", maxCount = 1) => {
  return (req, res, next) => {
    const uploader = upload.array(fieldName, maxCount);
    uploader(req, res, (err) => {
      if (err) {
        return next(ApiError.badRequest("File upload failed: " + err.message));
      }
      next();
    });
  };
};

const uploadSingle = (fieldName = "image") => {
  return (req, res, next) => {
    const uploader = upload.single(fieldName);
    uploader(req, res, (err) => {
      if (err) {
        return next(ApiError.badRequest("File upload failed: " + err.message));
      }
      next();
    });
  };
};

module.exports = { uploadImage, uploadSingle };

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// upload an image to a specific folder
const cloudinaryUploadImage = async (filesToUpload, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filesToUpload,
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            asset_id: result.asset_id,
            public_id: result.public_id,
          });
        }
      }
    );
  });
};

const cloudinaryDeleteImage = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          message: "Image deleted successfully.",
          result: result,
        });
      }
    });
  });
};

module.exports = { cloudinaryUploadImage, cloudinaryDeleteImage };

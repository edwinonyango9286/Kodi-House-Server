const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const cloudinaryUploadImage = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve({
            secure_url: result.secure_url,
            asset_id: result.asset_id,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Cloudinary upload failed without an error or result."));
        }
      }
    );
    
    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
};

const cloudinaryDeleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { cloudinaryUploadImage, cloudinaryDeleteImage };

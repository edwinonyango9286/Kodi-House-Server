const expressAsyncHandler = require("express-async-handler");
const { cloudinaryUploadImage, cloudinaryDeleteImage } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const sharp = require("sharp");

const uploadImages = expressAsyncHandler(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: "FAILED", message: "No files selected for upload." });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const resizedBuffer = await sharp(file.buffer)
          .resize(300, 300)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer(); 
        const result = await cloudinaryUploadImage(resizedBuffer, "kodihouse");
        return result;
      } catch (err) {
        logger.error(`Error processing ${file.originalname}:`, err);
        throw err;
      }
    });

    const results = await Promise.all(uploadPromises);
    
    return res.status(200).json({ status: "SUCCESS", message: "Images uploaded successfully.", data: results });
  } catch (error) {
    logger.error("Upload process failed:", error);
    next(error);
  }
});



const deleteImages = expressAsyncHandler(async (req, res, next) => {
  try {
    const { publicId } = req.params; 
    if (!publicId) {
      return res.status(400).json({ status: "FAILED", message: "Please provide image ID." });
    }

    const deleted = await cloudinaryDeleteImage(publicId);
    if (deleted.result === "ok") {
      return res.json({ status: "SUCCESS", message: "Image deleted successfully." });
    } else {
     return  res.status(404).json({ status: "FAILED", message: "Image not found." });
    }
  } catch (error) {
    logger.error("Delete error:", error);
    next(error);
  }
});

module.exports = { uploadImages, deleteImages };
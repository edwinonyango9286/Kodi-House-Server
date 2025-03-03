const expressAsyncHandler = require("express-async-handler");
const {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
} = require("../utils/cloudinary");
const fs = require("fs");

const uploadImages = expressAsyncHandler(async (req, res) => {
  try {
    const uploader = (path) => cloudinaryUploadImage(path, "kodihouse");
    const urls = [];
    const files = req.files;

    for (const file of files) {
      const { path } = file;
      const newpath = await uploader(path);
      urls.push(newpath);
      fs.unlinkSync(path);
    }
    const images = urls.map((file) => {
      return file;
    });
    return res.status(200).json({ status: "SUCCESS", data: images });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

const deleteImages = expressAsyncHandler(async (req, res) => {
  try {
    const { piblicId } = req.params;
    if (!piblicId) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Please provide image Id." });
    }

    const deleted = await cloudinaryDeleteImage(piblicId);
    if (deleted.result === "ok") {
      return res.json({
        status: "SUCCESS",
        message: "Image deleted successfully.",
      });
    } else {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Image not found." });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};

const express = require("express");
const {uploadImages,deleteImages} = require("../controllers/imageUploadController");
const {uploadImage,propertyImageResize} = require("../middlewares/uploadImages");
const { verifyUserToken } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/upload", verifyUserToken, uploadImage.array("images", 10), uploadImages);
router.post("/delete/:publicId", verifyUserToken, deleteImages);

// router.post("/upload", verifyUserToken, uploadImage.array("images", 10), propertyImageResize, uploadImages);
// router.post("/delete/:publicId", deleteImages , verifyUserToken);

module.exports = router;

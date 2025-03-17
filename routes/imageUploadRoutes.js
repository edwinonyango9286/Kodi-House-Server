const express = require("express");
const {uploadImages,deleteImages} = require("../controllers/imageUploadController");
const {uploadImage,propertyImageResize} = require("../middlewares/uploadImges");
const router = express.Router();

router.post("/upload",uploadImage.array("images", 10),propertyImageResize,uploadImages);
router.post("/delete/:publicId",deleteImages);

module.exports = router;

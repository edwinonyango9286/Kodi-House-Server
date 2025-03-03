const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  uploadImages,
  deleteImages,
} = require("../controllers/imageUploadController");
const {
  uploadImage,
  propertyImageResize,
} = require("../middlewares/uploadImges");

const router = express.Router();

router.post(
  "/upload",
  landlordAuthMiddleware,
  isAValidLandlord,
  uploadImage.array("images", 10),
  propertyImageResize,
  uploadImages
);
router.post(
  "/delete/:publicId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteImages
);

module.exports = router;

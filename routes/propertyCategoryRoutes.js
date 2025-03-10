const express = require("express");
const {
  addAPropertyCategory,
} = require("../controllers/popertyCategoryController");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/add_a_property_category",
  landlordAuthMiddleware,
  isAValidLandlord,
  addAPropertyCategory
);

module.exports = router;

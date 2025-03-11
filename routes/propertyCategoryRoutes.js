const express = require("express");
const {
  addAPropertyCategory,
  getAllPropertyCategories,
} = require("../controllers/propertyCategoryController");

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

router.get(
  "/get_all_property_categories",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllPropertyCategories
);

module.exports = router;

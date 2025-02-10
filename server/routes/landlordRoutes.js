const express = require("express");
const {
  landlordAuthMiddleware,
  isLandlord,
} = require("../middlewares/authMiddleware");
const {
  getALandlordWithAllRelatedData,
} = require("../controllers/landlordController");

const router = express.Router();

router.get(
  "/get-landlord-with-all-related-data",
  landlordAuthMiddleware,
  isLandlord,
  getALandlordWithAllRelatedData
);

module.exports = router;

const express = require("express");
const {
  landlordAuthMiddleware,
  isLandlord,
} = require("../middlewares/authMiddleware");
const {
  getALandlordWithAllRelatedData,
} = require("../controllers/landlordController");
const { addTenant } = require("../controllers/tenantControllers");

const router = express.Router();

router.get(
  "/get-landlord-with-all-related-data",
  landlordAuthMiddleware,
  isLandlord,
  getALandlordWithAllRelatedData
);

router.post("/add_tenant", landlordAuthMiddleware, isLandlord, addTenant);

module.exports = router;

const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  getALandlordWithAllRelatedData,
} = require("../controllers/landlordController");
const { addTenant } = require("../controllers/tenantControllers");

const router = express.Router();

router.get(
  "/get-landlord-with-all-related-data",
  landlordAuthMiddleware,
  isAValidLandlord,
  getALandlordWithAllRelatedData
);

router.post("/add_tenant", landlordAuthMiddleware, isAValidLandlord, addTenant);

module.exports = router;

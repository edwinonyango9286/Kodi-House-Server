const express = require("express");
const { verifyLandlordAccount } = require("../controllers/adminControllers");
const {
  adminAuthMiddleware,
  isAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.put(
  "/verify_landlord_account/:landlordId",
  adminAuthMiddleware,
  isAdmin,
  verifyLandlordAccount
);

module.exports = router;

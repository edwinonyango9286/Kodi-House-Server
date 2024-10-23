const express = require("express");
const {
  registerNewUser,
  activateTenantAccount,
  activateLandlordAccount,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register-new-user", registerNewUser);
router.post("/activate-tenant-account", activateTenantAccount);
router.post("/activate-landlord-account", activateLandlordAccount);

module.exports = router;

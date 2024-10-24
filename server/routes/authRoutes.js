const express = require("express");
const {
  registerNewUser,
  activateTenantAccount,
  activateLandlordAccount,
  loginLandlord,
  loginTenant,
  updatePassword,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// post routes

router.post("/register-new-user", registerNewUser);
router.post("/activate-tenant-account", activateTenantAccount);
router.post("/activate-landlord-account", activateLandlordAccount);
router.post("/login-tenant", loginTenant);
router.post("/login-landlord", loginLandlord);

// put routes
router.put("/update-user-password", authMiddleware, updatePassword);

module.exports = router;

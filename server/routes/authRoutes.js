const express = require("express");
const {
  registerNewUser,
  activateTenantAccount,
  activateLandlordAccount,
  loginLandlord,
  loginTenant,
  updatePassword,
  passwordResetToken,
  resetPassword,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// post routes

router.post("/register-new-user", registerNewUser);
router.post("/activate-tenant-account", activateTenantAccount);
router.post("/activate-landlord-account", activateLandlordAccount);
router.post("/login-tenant", loginTenant);
router.post("/login-landlord", loginLandlord);
router.post("/password-reset-token", passwordResetToken);

// put routes
router.put("/update-user-password", authMiddleware, updatePassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;

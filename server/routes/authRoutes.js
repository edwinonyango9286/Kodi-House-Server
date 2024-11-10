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
  loginAdmin,
  activateAdminAccount,
  logout,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// post routes

router.post("/register-new-user", registerNewUser);
router.post("/activate-admin-account", activateAdminAccount);
router.post("/activate-landlord-account", activateLandlordAccount);
router.post("/activate-tenant-account", activateTenantAccount);
router.post("/login-admin", loginAdmin);
router.post("/login-landlord", loginLandlord);
router.post("/login-tenant", loginTenant);
router.post("/password-reset-token", passwordResetToken);
router.post("/logout", authMiddleware, logout);

// put routes
router.put("/update-user-password", authMiddleware, updatePassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;

const express = require("express");
const {
  registerNewLandlord,
  activateLandlordAccount,
  loginLandlord,
  loginTenant,
  updatePassword,
  passwordResetToken,
  resetPassword,
  loginAdmin,
  logout,
} = require("../controllers/landlordController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// post routes
router.post("/register-new-landlord", registerNewLandlord);

router.post("/activate-landlord-account", activateLandlordAccount);
router.post("/login-admin", loginAdmin);
router.post("/login-landlord", loginLandlord);
router.post("/login-tenant", loginTenant);
router.post("/password-reset-token", passwordResetToken);
router.post("/logout", authMiddleware, logout);

// put routes
router.put("/update-user-password", authMiddleware, updatePassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;

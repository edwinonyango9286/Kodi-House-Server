const express = require("express");
const {
  registerNewLandlord,
  activateLandlordAccount,
  sigInLandlord,
  updatePassword,
  passwordResetToken,
  resetPassword,
  logout,
  refreshLandlordAccesToken,
} = require("../controllers/landlordAuthController");
const { landlordAuthMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// post routes
router.post("/register-new-landlord", registerNewLandlord);
router.post("/activate-landlord-account", activateLandlordAccount);
router.post("/login-landlord", sigInLandlord);
router.post("/refresh-access-token", refreshLandlordAccesToken);
router.post("/password-reset-token", passwordResetToken);
router.post("/logout", logout);

// put routes
router.put("/update-user-password", landlordAuthMiddleware, updatePassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;

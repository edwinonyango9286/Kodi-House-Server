const express = require("express");
const {registerNewUser, activateAdminAccount,activateLandlordAccount,activateTenantAccount,signInAdmin,signInTenant,signInLandlord,refreshUserAccessToken,updatePassword,resetPassword,passwordResetToken,logout,} = require("../controllers/authController");
const { verifyUserToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerNewUser);
router.post("/activate-landlord", activateLandlordAccount);
router.post("/activate-tenant", activateTenantAccount);
router.post("/activate-admin", activateAdminAccount);
router.post("/sign-in-landlord", signInLandlord);
router.post("/sign-in-admin", signInAdmin);
router.post("/sign-in-tenant", signInTenant);
router.post("/refresh-access-token", refreshUserAccessToken);
router.post("/password-reset-token", passwordResetToken);
router.put("/update-password",verifyUserToken,updatePassword, );
router.put("/reset-password/:token", resetPassword);
router.post("/logout", logout);

module.exports = router;

const express = require("express");
const { registerNewUser, activateAdminAccount, activateLandlordAccount, activateTenantAccount, signInAdmin, signInTenant, signInLandlord, refreshUserAccessToken, updatePassword, resetPassword, passwordResetToken, logout } = require("../controllers/authController");

const router = express.Router();

// post routes
router.post("/register_new_user", registerNewUser);
router.post("/activate_landlord_account", activateLandlordAccount);
router.post("/activate_tenant_account", activateTenantAccount)
router.post("/activate_admin_account", activateAdminAccount)
router.post("/sign_in_landlord", signInLandlord);
router.post("/sign_in_admin", signInAdmin)
router.post("/sign_in_tenant", signInTenant)
router.post("/refresh_access_token", refreshUserAccessToken);
router.post("/password_reset_token", passwordResetToken);
router.put("/update_landlord_password", updatePassword);
router.put("/reset_password/:token", resetPassword);
router.post("/logout", logout);

module.exports = router;

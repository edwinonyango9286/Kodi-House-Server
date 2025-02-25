const express = require("express");
const {
  // registerNewTenant,
  // activateTenantAccount,
  SignInTenant,
  logout,
  refreshTenantAccessToken,
  updatePassword,
  passwordResetToken,
} = require("../controllers/tenantAuthController");

const router = express.Router();

// router.post("/register-new-tenant", registerNewTenant);
// router.post("/activate-tenant-account", activateTenantAccount);
router.post("/login-tenant", SignInTenant);
router.put("/refresh_tenant_access_token", refreshTenantAccessToken);
router.put("/update_password", updatePassword);
router.post("/request_tenant_password_reset_token", passwordResetToken);
router.put("/logout", logout);

module.exports = router;

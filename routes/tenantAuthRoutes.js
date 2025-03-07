const express = require("express");
const {
  // registerNewTenant,
  // activateTenantAccount,
  SignInTenant,
  logout,
  refreshTenantAccessToken,
  updatePassword,
  passwordResetToken,
  deleteATenant,
  addATenant,
} = require("../controllers/tenantAuthController");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// router.post("/register-new-tenant", registerNewTenant);
// router.post("/activate-tenant-account", activateTenantAccount);
router.post(
  "/add_tenant",
  landlordAuthMiddleware,
  isAValidLandlord,
  addATenant
);

router.post("/signin_tenant", SignInTenant);
router.put("/refresh_tenant_access_token", refreshTenantAccessToken);
router.put("/update_password", updatePassword);
router.delete(
  "/delete_a_tenant/:tenantId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteATenant
);
router.post("/request_tenant_password_reset_token", passwordResetToken);
router.put("/logout", logout);

module.exports = router;

const express = require("express");
const {
  registerNewTenant,
  activateTenantAccount,
  loginTenant,
} = require("../controllers/tenantController");

const router = express.Router();

router.post("/register-new-tenant", registerNewTenant);
router.post("/activate-tenant-account", activateTenantAccount);
router.post("/login-tenant", loginTenant);


module.exports = router;

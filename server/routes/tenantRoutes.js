const express = require("express");
const {
  registerNewTenant,
  activateTenantAccount,
} = require("../controllers/tenantController");

const router = express.Router();

router.post("/register-new-tenant", registerNewTenant);
router.post("/activate-tenant-account", activateTenantAccount);

module.exports = router;

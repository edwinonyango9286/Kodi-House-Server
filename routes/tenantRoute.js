const express = require("express");
const {
  getAllTenants,
  disableTenant,
  activateTenant,
  updateTenantDetailsTenant,
  updateTenantDetailsLandlord,
  deleteTenantLandlord,
  deleteTenantTenant,
} = require("../controllers/tenantControllers");


const router = express.Router();
router.get("/get_all_tenants",getAllTenants);
router.patch("/disable_tenant/:tenantId",disableTenant);
router.patch("/activate_tenant/:tenantId",activateTenant);
router.patch("/update_a_tenant_landlord/:tenantId",updateTenantDetailsLandlord);
router.patch("/update_a_tenant_tenant/:tenantId",updateTenantDetailsTenant);
router.patch("/delete_a_tenant_landlord/:tenantId",deleteTenantLandlord);
router.patch("/delete_a_tenant_tenant",deleteTenantTenant);

module.exports = router;

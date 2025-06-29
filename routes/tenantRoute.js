const express = require("express");
const { disableTenant, activateTenant, updateTenantDetailsTenant, updateTenantDetailsLandlord, deleteTenantLandlord, deleteTenantTenant, createATenant } = require("../controllers/tenantControllers");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");


const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole("Landlord"), createATenant)
router.patch("/disable_tenant/:tenantId",disableTenant);
router.patch("/activate_tenant/:tenantId",activateTenant);
router.patch("/update_a_tenant_landlord/:tenantId",updateTenantDetailsLandlord);
router.patch("/update_a_tenant_tenant/:tenantId",updateTenantDetailsTenant);
router.patch("/delete_a_tenant_landlord/:tenantId",deleteTenantLandlord);
router.patch("/delete_a_tenant_tenant",deleteTenantTenant);

module.exports = router;

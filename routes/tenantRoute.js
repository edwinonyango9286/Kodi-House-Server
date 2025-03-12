const express = require("express");
const {
  getAllTenants,
  disableTenant,
  activateTenant,
  updateTenantDetailsTenant,
  updateTenantDetailsLandlord,
  deleteATenant,
  deleteTenantLandlord,
  deleteTenantTenant,
} = require("../controllers/tenantControllers");
const {
  isAValidLandlord,
  landlordAuthMiddleware,
  tenantAuthMiddleware,
  isTenant,
  isAValidTenant,
} = require("../middlewares/authMiddleware");
const { isValidObjectId } = require("mongoose");

const router = express.Router();

router.get(
  "/get_all_tenants",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllTenants
);

router.patch(
  "/disable_tenant/:tenantId",
  landlordAuthMiddleware,
  isAValidLandlord,
  disableTenant
);

router.patch(
  "/activate_tenant/:tenantId",
  landlordAuthMiddleware,
  isAValidLandlord,
  activateTenant
);

// update a tenant =>landlord
router.patch(
  "/update_a_tenant_landlord/:tenantId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateTenantDetailsLandlord
);
// update a tenant => tenant
router.patch(
  "/update_a_tenant_tenant/:tenantId",
  tenantAuthMiddleware,
  isValidObjectId,
  updateTenantDetailsTenant
);

router.patch(
  "/delete_a_tenant_landlord/:tenantId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteTenantLandlord
);

router.patch(
  "/delete_a_tenant_tenant",
  tenantAuthMiddleware,
  isAValidTenant,
  deleteTenantTenant
);

module.exports = router;

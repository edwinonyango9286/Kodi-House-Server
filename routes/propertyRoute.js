const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  addAProperty,
  getApropertyByIdLandlord,
  updateAproperty,
  asignPropertyToAtenant,
  getAllProperties,
  getAPropertyByIdUsers,
  deleteAProperty,
  vacateATenantFromAProperty,
  getApropertyById,
} = require("../controllers/propertyController");

const router = express.Router();

router.post(
  "/add_a_property",
  landlordAuthMiddleware,
  isAValidLandlord,
  addAProperty
);
router.get(
  "/get_a_property_by_id/:propertyId",
  getApropertyById
);

router.get("/get_all_properties", getAllProperties);

router.put(
  "/update_a_property/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateAproperty
);
router.patch(
  "/assign_a_property_to_a_tenant/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  asignPropertyToAtenant
);
router.patch(
  "/delete_a_property/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteAProperty
);
router.patch(
  "/assign_property_to_a_tenant/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  asignPropertyToAtenant
);

router.patch(
  "/vacate_tenant_from_a_property/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  vacateATenantFromAProperty
);
module.exports = router;

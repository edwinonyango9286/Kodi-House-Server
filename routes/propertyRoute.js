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
  getAllPropertiesByLandlord,
  getAllPropertiesByAllUsers,
  getAPropertyByIdUsers,
  deleteAProperty,
  vacateATenantFromAProperty,
} = require("../controllers/propertyController");

const router = express.Router();

router.post(
  "/add_a_property",
  landlordAuthMiddleware,
  isAValidLandlord,
  addAProperty
);
router.get(
  "/get_a_property_by_id_landlord/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  getApropertyByIdLandlord
);

// get all properties by all other users
router.get("/get_a_property_by_id_users/:propertyId", getAPropertyByIdUsers);

// get all properties by landlord => should return only properties related to the particular landlord
router.get(
  "/get_all_properties_by_landlord",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllPropertiesByLandlord
);

router.get("/get_all_properties_by_all_users", getAllPropertiesByAllUsers);

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

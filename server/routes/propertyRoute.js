const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  addAProperty,
  getApropertyById,
  getAllProperties,
  updateAproperty,
  asignPropertyToAtenant,
} = require("../controllers/propertyController");

const router = express.Router();

router.post(
  "/add_a_property",
  landlordAuthMiddleware,
  isAValidLandlord,
  addAProperty
);
router.get("/get_a_property_by_id/:propertyId", getApropertyById);
router.get(
  "/get_all_properties",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllProperties
);

router.put(
  "/update_a_property/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateAproperty
);
router.put(
  "/assign_a_property_to_a_tenant/:propertyId",
  landlordAuthMiddleware,
  isAValidLandlord,
  asignPropertyToAtenant
);

module.exports = router;

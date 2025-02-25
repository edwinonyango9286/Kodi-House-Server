const express = require("express");
const {
  landlordAuthMiddleware,
  isLandlord,
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
  isLandlord,
  addAProperty
);
router.get("/get_a_property_by_id/:propertyId", getApropertyById);
router.get(
  "/get_all_properties",
  landlordAuthMiddleware,
  isLandlord,
  getAllProperties
);

router.put(
  "/update_a_property/:propertyId",
  landlordAuthMiddleware,
  isLandlord,
  updateAproperty
);
router.put(
  "/assign_a_property_to_a_tenant/:propertyId",
  landlordAuthMiddleware,
  isLandlord,
  asignPropertyToAtenant
);

module.exports = router;

const express = require("express");

const {addAProperty,updateAproperty,asignPropertyToAtenant,getAllProperties,getAPropertyByIdUsers,deleteAProperty,vacateATenantFromAProperty,getApropertyById} = require("../controllers/propertyController");
const router = express.Router();

router.post("/add_a_property",addAProperty);
router.get("/get_a_property_by_id/:propertyId",getApropertyById);
router.get("/get_all_properties", getAllProperties);

router.put("/update_a_property/:propertyId",updateAproperty);
router.patch("/assign_a_property_to_a_tenant/:propertyId",asignPropertyToAtenant);
router.patch("/delete_a_property/:propertyId",deleteAProperty);
router.patch("/assign_property_to_a_tenant/:propertyId",asignPropertyToAtenant);
router.patch("/vacate_tenant_from_a_property/:propertyId",vacateATenantFromAProperty);
module.exports = router;

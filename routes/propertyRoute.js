const express = require("express");

const {addAProperty,updateAproperty,asignPropertyToAtenant,getAllProperties,getAPropertyByIdUsers,deleteAProperty,vacateATenantFromAProperty,getApropertyById} = require("../controllers/propertyController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/property",verifyUserToken, checkUserRole(["Landlord"]),addAProperty);
router.get("/property/:propertyId",getApropertyById);
router.get("/properties", verifyUserToken,checkUserRole(["Admin","Landlord"]),getAllProperties);

router.put("/update_a_property/:propertyId",updateAproperty);
router.patch("/assign_a_property_to_a_tenant/:propertyId",asignPropertyToAtenant);
router.patch("/delete_a_property/:propertyId",deleteAProperty);
router.patch("/assign_property_to_a_tenant/:propertyId",asignPropertyToAtenant);
router.patch("/vacate_tenant_from_a_property/:propertyId",vacateATenantFromAProperty);
module.exports = router;

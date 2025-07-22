const express = require("express");
const { addAProperty,updateAproperty,asignPropertyToAtenant,getAllProperties,deleteAProperty,vacateATenantFromAProperty,getApropertyById, bulkDeleteProperties } = require("../controllers/propertyController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/property",verifyUserToken, checkUserRole(["Landlord"]),addAProperty);
router.get("/property/:propertyId",getApropertyById);
router.get("/properties",verifyUserToken,checkUserRole(["Landlord","Admin"]),getAllProperties);
router.put("/update-property/:propertyId",verifyUserToken, checkUserRole(["Landlord"]), updateAproperty);
router.patch("/delete-a-property/:propertyId", verifyUserToken, checkUserRole(["Landlord","Admin"]), deleteAProperty);
router.patch("/assign_property_to_a_tenant/:propertyId", verifyUserToken, checkUserRole(["Landlord"]), asignPropertyToAtenant);
router.patch("/vacate_tenant_from_a_property/:propertyId",verifyUserToken, checkUserRole(["Landlord"]), vacateATenantFromAProperty);
router.patch("/properties/bulk-delete", verifyUserToken, checkUserRole(["Admin"]), bulkDeleteProperties )

module.exports = router;

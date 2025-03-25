const express = require("express");
const { createAPropertyType, updateApropertyType, getApropertyType, deleteAPropertyType, getAllPropertyTypes } = require("../controllers/propertyTypeControllers");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole(["Admin"]),createAPropertyType)
router.patch("/:propertyTypeId/update", verifyUserToken, checkUserRole(["Admin"]), updateApropertyType)
router.get("/:propertyTypeId" , getApropertyType)
router.patch("/:propertyTypeId/delete", verifyUserToken, checkUserRole(["Admin"]), deleteAPropertyType)
router.get("/property-types/get", getAllPropertyTypes)

module.exports = router;

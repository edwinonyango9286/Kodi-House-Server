const express = require("express");
const { createAPropertyType, updateApropertyType, getApropertyType, deleteAPropertyType, getAllPropertyTypes } = require("../controllers/propertyTypeControllers");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole(["Admin"]),createAPropertyType)
router.get("/property-types/list", getAllPropertyTypes)
router.patch("/:propertyTypeId/update", verifyUserToken, checkUserRole(["Admin"]), updateApropertyType)
router.get("/:propertyTypeId" , getApropertyType)
router.patch("/:propertyTypeId/delete", verifyUserToken, checkUserRole(["Admin"]), deleteAPropertyType)

module.exports = router;

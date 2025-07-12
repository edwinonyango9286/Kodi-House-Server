const express = require("express");
const {createARole,updateARole,getAllRoles,getARole,deleteARole, grantPermissionToARole, renameARole} = require("../controllers/roleController");
const { verifyUserToken, checkUserRole, checkUserPermission } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/create",verifyUserToken, checkUserRole(["Admin","Landlord"]), createARole);
router.get("/all/roles", verifyUserToken, checkUserRole(["Admin","Landlord"]), getAllRoles);
router.get("/:roleId", verifyUserToken,checkUserRole(["Admin","Landlord"]), getARole);
router.patch("/:roleId/update", verifyUserToken, checkUserRole(["Admin",]),updateARole);
router.patch("/:roleId/delete", verifyUserToken, checkUserRole(["Admin"]), deleteARole);
router.patch("/:roleId/grant_permission", verifyUserToken, checkUserRole(["Admin"]), grantPermissionToARole);
router.patch("/:roleId/rename", verifyUserToken,checkUserRole(["Admin"]), renameARole)


module.exports = router;

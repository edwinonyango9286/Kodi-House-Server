const express = require("express");
const {createARole,updateARole,getAllRoles,getARole,deleteARole, grantPermissionToARole, renameARole} = require("../controllers/roleController");
const { verifyUserToken, checkUserRole, checkUserPermission } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole(["Admin"]), checkUserPermission("create_a_role"),createARole);
router.get("/all/roles", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("view_all_roles"), getAllRoles);
router.get("/:roleId", verifyUserToken,checkUserRole(["Admin","Landlord"]), checkUserPermission("get_a_role"), getARole);
router.patch("/:roleId/update", verifyUserToken, checkUserRole(["Admin",]), checkUserPermission("update_a_role"), updateARole);
router.patch("/:roleId/delete", verifyUserToken, checkUserRole(["Admin"]), checkUserPermission("delete_a_role"), deleteARole);
router.patch("/:roleId/grant_permission", verifyUserToken, checkUserRole(["Admin"]), grantPermissionToARole);
router.patch("/:roleId/rename", verifyUserToken,checkUserRole(["Admin"]), renameARole)



module.exports = router;

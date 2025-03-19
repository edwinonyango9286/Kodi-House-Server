const express = require("express");
const {createARole,updateARole,getAllRoles,getARole,deleteARole, grantPermissionToARole} = require("../controllers/roleController");
const { verifyUserToken, checkUserRole, checkUserPermission } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/role", verifyUserToken, checkUserRole(["Admin","Landlord"]) , checkUserPermission("create_a_role"), createARole);
router.get("/role/:roleId", verifyUserToken,checkUserRole(["Admin","Landlord"]), checkUserPermission("get_a_role"), getARole);
router.patch("/role/:roleId/update", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("update_a_role"), updateARole);
router.get("/roles", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("get_all_roles"), getAllRoles);
router.patch("/roles/:roleId/delete", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("delete_a_role"), deleteARole);
router.patch("/role/:roleId/grant_permission", verifyUserToken, checkUserRole(["Admin","Landlord"]), grantPermissionToARole  )



module.exports = router;

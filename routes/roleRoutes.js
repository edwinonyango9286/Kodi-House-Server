const express = require("express");
const {createARole,updateARole,getAllRoles,getARole,deleteARole} = require("../controllers/roleController");
const { verifyUserToken, checkUserRole, checkUserPermission } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/roles", verifyUserToken, checkUserRole(["Admin","Landlord"]) , checkUserPermission("create_a_role"), createARole);
router.get("/roles/:roleId", verifyUserToken,checkUserRole(["Admin","Landlord"]), checkUserPermission("get_a_role"), getARole);
router.patch("/roles/:roleId", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("update_a_role"), updateARole);
router.get("/roles", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("get_all_roles"), getAllRoles);
router.delete("/roles/:roleId", verifyUserToken, checkUserRole(["Admin","Landlord"]), checkUserPermission("delete_a_role"), deleteARole);

module.exports = router;

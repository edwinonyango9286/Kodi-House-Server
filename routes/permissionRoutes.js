const express = require("express");
const { createAPermission, updateAPermission, getAllPermissions, getAPermission, deleteAPermission, restoreADeletedPermission } = require("../controllers/permissionController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/permission", verifyUserToken, checkUserRole(["Admin"]),createAPermission);
router.patch("/permission/:permissionId/update", verifyUserToken,checkUserRole(["Admin"]), updateAPermission);
router.get("/permissions", verifyUserToken, checkUserRole(["Admin", "Landlord"]) , getAllPermissions);
router.get("/permission/:permissionId/get" , verifyUserToken, checkUserRole(["Admin", "Landlord"]), getAPermission)
router.patch("/permission/:permissionId/delete", verifyUserToken, checkUserRole(["Admin",]), deleteAPermission)
router.patch("/permission/:permissionId/restore", verifyUserToken, checkUserRole(["Admin"]), restoreADeletedPermission)



module.exports = router;

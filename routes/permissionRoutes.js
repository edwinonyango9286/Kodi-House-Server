const express = require("express");
const { createAPermission, updateAPermission, getAllPermissions, getAPermission, deleteAPermission, restoreADeletedPermission } = require("../controllers/permissionController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/create", verifyUserToken, checkUserRole(["Admin"]),createAPermission);
router.patch("/:permissionId/update", verifyUserToken,checkUserRole(["Admin"]), updateAPermission);
router.get("/permissions", verifyUserToken, checkUserRole(["Admin", "Landlord"]) , getAllPermissions);
router.get("/:permissionId" , verifyUserToken, checkUserRole(["Admin", "Landlord"]), getAPermission)
router.patch("/:permissionId/delete", verifyUserToken, checkUserRole(["Admin",]), deleteAPermission)
router.patch("/:permissionId/restore", verifyUserToken, checkUserRole(["Admin"]), restoreADeletedPermission)



module.exports = router;

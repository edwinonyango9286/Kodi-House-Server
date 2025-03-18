const express = require("express");
const { createAPermission } = require("../controllers/permissionController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/create_a_permission", verifyUserToken, checkUserRole(["Admin"]) ,createAPermission);

module.exports = router;

const express = require("express");
const {
  registerSuperAdmin,
  registerAdminUser,
  signInSuperAdmin,
  refreshAdminAccessToken,
} = require("../controllers/adminAuthController");
const { isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register_super_admin", registerSuperAdmin);
router.post("/signin_super_admin", signInSuperAdmin);
router.post("/register_admin_user", isSuperAdmin, registerAdminUser);
router.put("/refresh_admin_access_token",refreshAdminAccessToken)

module.exports = router;

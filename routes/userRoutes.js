const express = require("express");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware")
const { me, updateUserProfile, listUsersByUserType, createSystemUser, listSystemUsers} = require("../controllers/userController");
const router = express.Router();

router.post("/create",verifyUserToken,checkUserRole(["Admin"]), createSystemUser)
router.get("/user-profile", verifyUserToken, me);
router.patch("/update-landlord-info", verifyUserToken, updateUserProfile );
router.get("/list-users/:userType", verifyUserToken, checkUserRole(["Admin"]),listUsersByUserType)
router.get("/list-system-users", verifyUserToken, checkUserRole(["Admin"]), listSystemUsers)


module.exports = router;

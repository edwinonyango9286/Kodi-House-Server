const express = require("express");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware")
const { me, updateUserProfile, listUsers, createSystemUser, listSystemUsers, listLandlordUsers, updateUserAvatar} = require("../controllers/userController");
const router = express.Router();

router.post("/create",verifyUserToken,checkUserRole(["Admin"]), createSystemUser)
router.get("/user-profile", verifyUserToken, me);
router.patch("/update-user-profile",verifyUserToken,updateUserProfile)
router.get("/list-users", verifyUserToken, checkUserRole(["Admin","Landlord"]),listUsers);
router.get("/list-landlord-users", verifyUserToken, checkUserRole("Landlord"), listLandlordUsers)
router.get("/list-system-users", verifyUserToken, checkUserRole(["Admin"]), listSystemUsers)
router.patch("/update-avatar", verifyUserToken,updateUserAvatar)


module.exports = router;

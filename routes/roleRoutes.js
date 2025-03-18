const express = require("express");
const {addARole,updateARole,getAllRoles,getARole,deleteARole} = require("../controllers/roleController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const router = express.Router();


router.post("/add_role", verifyUserToken, checkUserRole(["Admin","Landlord"]) , addARole);
router.get("/get_a_role/:roleId", verifyUserToken,checkUserRole(["Admin","Landlord"]), getARole);
router.put("/update_a_role/:roleId", verifyUserToken, checkUserRole(["Admin","Landlord"]), updateARole);
router.get("/get_all_roles",verifyUserToken, checkUserRole(["Admin","Landlord"]), getAllRoles);
router.delete("/delete_role/:roleId", verifyUserToken, checkUserRole(["Admin","Landlord"]), deleteARole);

module.exports = router;

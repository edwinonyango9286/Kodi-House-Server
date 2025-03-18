const express = require("express");
const {addARole,updateARole,getAllRoles,getARole,deleteARole} = require("../controllers/roleController");
const router = express.Router();

router.post("/add_role", addARole);
router.get("/get_a_role/:roleId",getARole);
router.put("/update_a_role/:roleId",updateARole);
router.get("/get_all_roles",getAllRoles);
router.delete("/delete_role/:roleId",deleteARole);

module.exports = router;

const express = require("express");
const {addANewUnit,updateAUnit,deleteAUnit,getAllUnits,addFields,} = require("../controllers/unitController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

const router = express.Router();
router.post("/add-a-unit", verifyUserToken,checkUserRole(["Landlord"]), addANewUnit);
router.patch("/update_a_unit/:unitId",updateAUnit);
router.delete("/delete_a_unit/:unitId",deleteAUnit);
router.put("/update", addFields);
router.get("/units",verifyUserToken, checkUserRole(["Admin", "Landlord"]),getAllUnits);

module.exports = router;

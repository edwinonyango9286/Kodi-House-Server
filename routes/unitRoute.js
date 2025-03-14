const express = require("express");
const {landlordAuthMiddleware,isAValidLandlord,} = require("../middlewares/authMiddleware");
const {addANewUnit,updateAUnit,deleteAUnit,getAllUnits,addFields,} = require("../controllers/unitController");

const router = express.Router();
router.post("/add_a_unit",landlordAuthMiddleware, isAValidLandlord, addANewUnit);
router.patch("/update_a_unit/:unitId",landlordAuthMiddleware,isAValidLandlord,updateAUnit);
router.delete("/delete_a_unit/:unitId",landlordAuthMiddleware,isAValidLandlord,deleteAUnit);
router.put("/update", addFields);
router.get("/get_all_units", getAllUnits);

module.exports = router;

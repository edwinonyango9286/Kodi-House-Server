const express = require("express");
const {addANewUnit,updateAUnit,deleteAUnit,getAllUnits,addFields,} = require("../controllers/unitController");

const router = express.Router();
router.post("/add_a_unit", addANewUnit);
router.patch("/update_a_unit/:unitId",updateAUnit);
router.delete("/delete_a_unit/:unitId",deleteAUnit);
router.put("/update", addFields);
router.get("/get_all_units", getAllUnits);

module.exports = router;

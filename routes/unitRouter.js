const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  addANewUnit,
  updateAUnit,
  deleteAUnit,
  getAllUnits,
} = require("../controllers/unitController");

const router = express.Router();
router.post(
  "/add_a_unit",
  landlordAuthMiddleware,
  isAValidLandlord,
  addANewUnit
);

router.put(
  "/update_a_unit/:unitId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateAUnit
);
router.delete(
  "/delete_a_unit/:unitId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteAUnit
);


router.get("/get_all_units" , landlordAuthMiddleware, isAValidLandlord, getAllUnits)
module.exports = router;

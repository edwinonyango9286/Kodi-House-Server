const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const {
  addARole,
  updateARole,
  getAllRoles,
  getARole,
} = require("../controllers/roleController");

const router = express.Router();

router.post("/add-role", landlordAuthMiddleware, isAValidLandlord, addARole);
router.get("/get-a-role/:roleId", landlordAuthMiddleware, isAValidLandlord, getARole);
router.put(
  "/update-a-role/:roleId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateARole
);
router.get("/get-all-roles", landlordAuthMiddleware, isAValidLandlord, getAllRoles);
router.delete("/delete-role");

module.exports = router;

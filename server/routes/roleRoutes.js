const express = require("express");
const {
  landlordAuthMiddleware,
  isLandlord,
} = require("../middlewares/authMiddleware");
const {
  addARole,
  updateARole,
  getAllRoles,
  getARole,
} = require("../controllers/roleController");

const router = express.Router();

router.post("/add-role", landlordAuthMiddleware, isLandlord, addARole);
router.get("/get-a-role/:roleId", landlordAuthMiddleware, isLandlord, getARole);
router.put(
  "/update-a-role/:roleId",
  landlordAuthMiddleware,
  isLandlord,
  updateARole
);
router.get("/get-all-roles", landlordAuthMiddleware, isLandlord, getAllRoles);
router.delete("/delete-role");

module.exports = router;

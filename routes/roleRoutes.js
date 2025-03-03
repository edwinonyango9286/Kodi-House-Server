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
  deleteARole,
} = require("../controllers/roleController");

const router = express.Router();

router.post("/add_role", landlordAuthMiddleware, isAValidLandlord, addARole);
router.get(
  "/get_a_role/:roleId",
  landlordAuthMiddleware,
  isAValidLandlord,
  getARole
);
router.put(
  "/update_a_role/:roleId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateARole
);
router.get(
  "/get_all_roles",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllRoles
);
router.delete(
  "/delete_role/:roleId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteARole
);

module.exports = router;

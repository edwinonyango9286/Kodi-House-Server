const express = require("express");
const {
  isAValidLandlord,
  landlordAuthMiddleware,
} = require("../middlewares/authMiddleware");
const {
  addAuser,
  getAUserById,
  getAllLandlordUsers,
  updateAUserById,
  softDeleteAUserById,
} = require("../controllers/userControllers");

const router = express.Router();

router.post("/add-user", landlordAuthMiddleware, isAValidLandlord, addAuser);
router.get(
  "/get-user/:userId",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAUserById
);
router.get(
  "/get-users",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllLandlordUsers
);
router.put(
  "/update-user/:userId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateAUserById
);

// soft delete user => soft delete users for consistency
router.delete(
  "/delete-user/:userId",
  landlordAuthMiddleware,
  isAValidLandlord,
  softDeleteAUserById
);

module.exports = router;

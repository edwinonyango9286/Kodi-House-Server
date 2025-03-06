const express = require("express");
const {
  isAValidLandlord,
  landlordAuthMiddleware,
} = require("../middlewares/authMiddleware");
const {
  addAuser,
  getAUserById,
  updateAUserById,
  softDeleteAUserById,
} = require("../controllers/userController");
const { getAllUsers } = require("../controllers/userController");

const router = express.Router();

router.post("/add_user", landlordAuthMiddleware, isAValidLandlord, addAuser);
router.get(
  "/get_user/:userId",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAUserById
);
router.get(
  "/get_all_users",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllUsers
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

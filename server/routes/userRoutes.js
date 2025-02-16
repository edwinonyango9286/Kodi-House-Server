const express = require("express");
const { isLandlord, landlordAuthMiddleware } = require("../middlewares/authMiddleware");
const {
  addAuser,
  getAUserById,
  getAllLandlordUsers,
  updateAUserById,
  softDeleteAUserById,
} = require("../controllers/userControllers");

const router = express.Router();

router.post("/add-user", landlordAuthMiddleware, isLandlord, addAuser);
router.get("/get-user/:userId", landlordAuthMiddleware, isLandlord, getAUserById);
router.get("/get-users", landlordAuthMiddleware, isLandlord, getAllLandlordUsers);
router.put("/update-user/:userId", landlordAuthMiddleware, isLandlord, updateAUserById);

// soft delete user => soft delete users for consistency
router.delete(
  "/delete-user/:userId",
  landlordAuthMiddleware,
  isLandlord,
  softDeleteAUserById
);

module.exports = router;

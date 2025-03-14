const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const { me, updateLandlordProfileLandlord } = require("../controllers/landlordController");
const router = express.Router();
router.get("/me", landlordAuthMiddleware, isAValidLandlord, me);
router.patch("/update_landlord_profile_landlord", landlordAuthMiddleware, isAValidLandlord,updateLandlordProfileLandlord );

module.exports = router;

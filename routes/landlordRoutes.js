const express = require("express");
const {} = require("../middlewares/authMiddleware");
const { me, updateLandlordProfileLandlord } = require("../controllers/landlordController");
const router = express.Router();
router.get("/me", me);
router.patch("/update_landlord_profile_landlord",updateLandlordProfileLandlord );

module.exports = router;

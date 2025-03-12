const express = require("express");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");
const { me } = require("../controllers/landlordController");
const router = express.Router();
router.get("/me", landlordAuthMiddleware, isAValidLandlord, me);

module.exports = router;

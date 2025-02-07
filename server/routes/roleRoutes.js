const express = require("express");
const {
  landlordAuthMiddleware,
  isLandlord,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add-role", landlordAuthMiddleware, isLandlord);
router.put("/update-role/:id", landlordAuthMiddleware, isLandlord);
router.get("/get-all/:id", landlordAuthMiddleware, isLandlord);
router.delete("/delete-role",)

module.exports = router;

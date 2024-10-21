const express = require("express");
const {
  registerTenant,
  registerLandlord,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register-tenant", registerTenant);
router.post("/register-landlord", registerLandlord);

module.exports = router;

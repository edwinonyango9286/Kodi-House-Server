const express = require("express");
const { getAllTenants } = require("../controllers/tenantControllers");
const {
  isAValidLandlord,
  landlordAuthMiddleware,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/get_all_tenants",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllTenants
);

module.exports = router;

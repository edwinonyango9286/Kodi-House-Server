const express = require("express");
const { createLease } = require("../controllers/leaseController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

const router = express.Router();
router.post("/create", verifyUserToken, checkUserRole(["Admin", "Landlord"]), createLease)



module.exports = router
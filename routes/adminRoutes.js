const express = require("express");
const {
  adminAuthMiddleware,
  isAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();

module.exports = router;

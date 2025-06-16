const express = require("express");
const router = express.Router();
const {verifyUserToken, checkUserRole}  = require("../middlewares/authMiddleware");
const { createCategory, getAllCategories } = require("../controllers/categoryController");

router.post("/create", verifyUserToken, checkUserRole("Admin"), createCategory);
router.get("/list", verifyUserToken, checkUserRole("Admin"), getAllCategories)

module.exports = router
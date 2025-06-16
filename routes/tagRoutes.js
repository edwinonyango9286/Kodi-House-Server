const express = require("express");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const { createATag, getAllTags } = require("../controllers/tagController");

const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole("Admin"),createATag )
router.get('/list', verifyUserToken, checkUserRole("Admin"), getAllTags)


module.exports = router;
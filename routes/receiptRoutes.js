const express = require("express");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const { getAllReceipts, generateReceipt } = require("../controllers/receiptController");
const router = express.Router();

router.post("/receipts/generate",verifyUserToken,checkUserRole(["LandLord", "Admin"]),generateReceipt)
router.get("/receipts", verifyUserToken , checkUserRole(["Admin"]), getAllReceipts);




module.exports = router
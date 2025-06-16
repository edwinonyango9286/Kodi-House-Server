const express = require("express");
const router = express.Router()
const {createATransaction, listAllTransactions} = require("../controllers/transactionController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

router.post("/create", verifyUserToken, createATransaction)
router.get("/list-transactions", verifyUserToken, checkUserRole(["Admin"]), listAllTransactions)

module.exports = router
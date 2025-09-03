const express = require("express");
const router = express.Router()
const {createATransaction, listAllTransactions} = require("../controllers/transactionController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

router.post("/create", verifyUserToken, createATransaction)
// Tenant transactions=>Transactions made by tenant for rent payment or lease payment
// Landlord transatctions=> Get the property or the unit the tenant has paid for
// Admin => Views the list of all transactions
router.get("/transactions", verifyUserToken, checkUserRole(["Admin","Tenant","Landlord"]), listAllTransactions)

module.exports = router
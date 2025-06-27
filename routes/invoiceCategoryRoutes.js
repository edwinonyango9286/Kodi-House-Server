const express = require("express");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");
const { createAnInvoiceCategory } = require("../controllers/invoiceCategoryController");


const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole(["Landlord"]), createAnInvoiceCategory);


module.exports = router;

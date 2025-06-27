const express = require("express");
const {getAllInvoices,createInvoice,deleteAnInvoice,updateAnInvoice, updateInvoiceStatus} = require("../controllers/invoiceController");
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware");

const router = express.Router();
router.post("/create-invoice",verifyUserToken, checkUserRole(["Admin", "Landlord"]), createInvoice);
router.get("/invoices", verifyUserToken,checkUserRole(["Admin","Landlord"]), getAllInvoices);
router.delete("/delete_invoice/:invoiceId",deleteAnInvoice);
router.patch("/update_an_invoice/:invoiceId",updateAnInvoice);
router.patch("/update_invoice_status/:invoiceId",updateInvoiceStatus)

module.exports = router;

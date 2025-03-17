const express = require("express");
const {getAllInvoices,createInvoice,deleteAnInvoice,updateAnInvoice, updateInvoiceStatus} = require("../controllers/invoiceController");

const router = express.Router();
router.post("/create_invoice",createInvoice);
router.get("/get_all_invoices",getAllInvoices);
router.delete("/delete_invoice/:invoiceId",deleteAnInvoice);
router.patch("/update_an_invoice/:invoiceId",updateAnInvoice);
router.patch("/update_invoice_status/:invoiceId",updateInvoiceStatus)

module.exports = router;

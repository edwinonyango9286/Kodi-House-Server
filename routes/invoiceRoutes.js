const express = require("express");
const { getAllInvoices } = require("../controllers/invoiceController");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");

const router = express.Router();
router.get(
  "/get_all_invoices",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllInvoices
);

module.exports = router;

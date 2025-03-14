const express = require("express");
const {
  getAllInvoices,
  createInvoice,
  deleteAnInvoice,
  updateAnInvoice,
} = require("../controllers/invoiceController");
const {
  landlordAuthMiddleware,
  isAValidLandlord,
} = require("../middlewares/authMiddleware");

const router = express.Router();
router.post(
  "/create_invoice",
  landlordAuthMiddleware,
  isAValidLandlord,
  createInvoice
);

router.get(
  "/get_all_invoices",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllInvoices
);

router.delete(
  "/delete_invoice/:invoiceId",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteAnInvoice
);

router.patch(
  "/update_an_invoice/:invoiceId",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateAnInvoice
);

module.exports = router;

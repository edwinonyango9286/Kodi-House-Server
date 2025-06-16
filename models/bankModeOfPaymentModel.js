const mongoose = require("mongoose");

const bankModeOfPaymentSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    bankAddress: {
      type: String,
      required: true,
    },
    bankBranch: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: Number,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BankModeOfPayment", bankModeOfPaymentSchema);

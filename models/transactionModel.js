const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    transactionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionName: {
      type: String,
      default: "RentPayment",
    },
    amount: {
      type: Number,
      required: true,
      min:0
    },
    transactionId: {
      type: String,
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "canceled", "refunded"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);

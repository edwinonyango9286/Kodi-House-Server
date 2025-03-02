const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: true,
      maxlength: 2000,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commissionType: {
      type: String,
      required: true,
      enum: ["Fixed", "Percentage"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);

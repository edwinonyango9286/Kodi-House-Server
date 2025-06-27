const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    transactionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid object Id.`,
      },
    },
    transactionName: {
      type: String,
      default: "RentPayment",
    },
    amount: {
      type: String,
      required: "true",
    },
    transactionId: {
      type: String,
      required: true,
    },

    transactionDate: {
      type: Date,
      required: true,
      default: Date.now(),
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid object id`,
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updateAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);

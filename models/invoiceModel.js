const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },
    
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 2000,
    },
    allowedMethodOfPayment: {
      type: String,
      required: true,
      enum: ["Cash", "Mpesa", "Airtel Money", "Bank Transfer"],
    },
    tag: {
      type: String,
      required: true,
    },
    recurringStatus: {
      type: String,
      required: true,
      enum: [
        "Yes",
        "No",
        "Every 1 Month",
        "Every 3 Months",
        "Every 6 Months",
        "Every 12 Months",
      ],
    },
    tenantsNote: {
      type: String,
      minlength: 2,
      maxlength: 2000,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },
    invoiceCategory: {
      type: String,
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },

    invoiceDate: {
      type: Date,
      default: Date.now(),
    },

    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Paid", "Draft", "Overdue", "Partially paid"],
      default: "Overdue",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updateBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);

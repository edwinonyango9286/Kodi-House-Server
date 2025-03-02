const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Landlord",
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
      trim: true,
      lowercase: true,
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
    recurringInvoice: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
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
      ref: "Tenant",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId(id);
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
          return mongoose.Schema.Types.ObjectId(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId(id);
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
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);

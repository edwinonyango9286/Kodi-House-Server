const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    transactionId: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 2000,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    attachment: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    paymentMode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModesOfPayment",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Receipt", receiptSchema);

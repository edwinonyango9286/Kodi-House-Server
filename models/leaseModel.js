const mongoose = require("mongoose");

const leaseSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId(id);
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
          return mongoose.Types.ObjectId(id);
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
          return mongoose.Types.ObjectId(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },

    startDate: {
      type: Date,
      required: true,
    },

    paymentSchedule: {
      type: String,
      required: true,
    },

    securityDeposit: {
      type: Number,
      required: true,
    },
    serviceCharge: {
      type: Amount,
      required: true,
    },

    lateFees: {
      type: Number,
      required: true,
    },

    tenantOccupation: {
      type: String,
      required: true,
    },
    nextOfKin: {
      type: String,
      required: true,
    },
    workContact: {
      type: String,
      required: true,
    },
    termsOfAgreement: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },

    termsAndConditions: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },

    endDate: {
      tyep: Date,
      required: true,
    },
    leaseAmount: {
      type: Number,
      required: true,
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
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId(id);
        },
        message: (props) => `${props} is not a valid mongodbId`,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["Piad", "Draft", "Expired", "Pending"],
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lease", leaseSchema);

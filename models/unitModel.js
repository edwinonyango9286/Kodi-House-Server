const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid objectId`,
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
    currentOccupant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      validate: {
        validator: function (id) {
          return id === null || mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid objectId`,
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
        message: (props) => `${props} is not a valid objectId`,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnitCategory",
      required: true,
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid objectId`,
      },
    },
    rentPerMonth: {
      type: Number,
      required: true,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    tags: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid objectId`,
      },
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },
    videos: [
      {
        secure_url: {
          type: String,
        },
        public_id: {
          type: String,
        },
      },
    ],
    images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
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
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Unit", unitSchema);

const mongoose = require("mongoose");
const { validate } = require("./landlordModel");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
      lowercase: true,
    },
    secondName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Agent", "Cleaner", "Security Officer"],
    },
    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Disabled",
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },

    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Property",
        validate: {
          validator: function (id) {
            return mongoose.Schema.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],
    units: [
      {
            type: mongoose.Schema.Types.ObjectId,
          ref:"Unit",
        required: true,
        validate: {
          validator: function (id) {
            return mongoose.Schema.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

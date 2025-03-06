const mongoose = require("mongoose");

// these users are property management users like watchman,caretaker and agents
const userSchema = new mongoose.Schema(
  {
    // landlord who adds the user
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid ObjectId.`,
      },
    },
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
      unique: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // one user can have more than one role
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid ObjectId.`,
      },
    },

    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
      lowercase: true,
    },

    //a single user can be assigned to several properties
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    // a single user can be assigned to several units
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
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
    userState: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

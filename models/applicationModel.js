// Users sends applications from the app.
const mongoose = require("mongoose");

const applicationsSchema = new mongoose.Schema(
  {
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    //   validate: {
    //     validator: (id) => {
    //       return mongoose.Types.ObjectId.isValid(id);
    //     },
    //     message: (props) => `${props.value} is not a valid objectId`,
    //   },
    // },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    property: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid objectId`,
        },
      },
    ],
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
    tourDate: {
      type: Date,
      required: true,
    },
    tourTime: {
      type: String,
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
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Declined"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Applications", applicationsSchema);

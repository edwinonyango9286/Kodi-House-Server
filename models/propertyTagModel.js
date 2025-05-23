const mongoose = require("mongoose");

const propertyTagSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid object id.`,
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid object id.`,
      },
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
      minlength: 2,
    },
    slug: {
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
        message: (props) => `${props} is not a valid object id.`,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Disabled"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PropertyTag", propertyTagSchema);

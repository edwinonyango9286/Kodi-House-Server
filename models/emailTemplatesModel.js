const mongoose = require("mongoose");
const { validate } = require("./userModel");

const emailTemplateSchema = new mongoose.Schema(
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
      minlenght: 2,
      maxlength: 50,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
      minlenght: 2,
    },

    category: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Disabled"],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);

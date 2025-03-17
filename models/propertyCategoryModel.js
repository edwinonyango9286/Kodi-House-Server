const mongoose = require("mongoose");

// property categories applies to all the users
const propertyCategorySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Disabled"],
    },
    description: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PropertyCategory", propertyCategorySchema);

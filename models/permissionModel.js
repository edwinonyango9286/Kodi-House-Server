const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      minLength: 2,
      maxLenght: 50,
    },
    description: {
      type: String,
      required: true,
      maxLength: 2000,
      minLength: 2,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Disabled"],
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
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Permission", permissionSchema);

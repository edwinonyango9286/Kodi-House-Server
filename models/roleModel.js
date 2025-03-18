const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    addedBy: {
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
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props} is not a valid object id `,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);

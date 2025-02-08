const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        default: [],
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid objectId`,
        },
      },
    ],

    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);

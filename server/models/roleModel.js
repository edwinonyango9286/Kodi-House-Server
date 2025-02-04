const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        validate: {
          validator: function (id) {
            return mongoose.Schema.Types.ObjectId.isValid(id);
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

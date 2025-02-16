const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
    category: {
      type: String,
      required: true,
      enum: ["Work", "Private", "Support", "Promotion"],
    },
    subject: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
    },
    tag: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      lowercase: true,
      minlength: 1,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);

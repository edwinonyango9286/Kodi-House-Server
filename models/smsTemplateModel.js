const mongoose = require("mongoose");

const smsTemplateSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    vlidate: {
      validator: (id) => {
        return mongoose.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props} is not a valid object id`,
    },
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    vlidate: {
      validator: (id) => {
        return mongoose.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props} is not a valid object id`,
    },
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
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
    vlidate: {
      validator: (id) => {
        return mongoose.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props} is not a valid object id`,
    },
  },
});

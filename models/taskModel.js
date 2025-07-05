const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  createdBy: {
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    validate: {
      validator: (id) => {
        return mongoose.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props.value} is not a valid objectId`,
    },
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    minlength: 2,
    maxlength: 2000,
    trim: true,
    lowercase: true,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
    },
  ],

  priority: {
    type: String,
    required: true,
    enum: ["Low", "Urgent", "Medium"],
  },

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
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
    validate: {
      validator: function (id) {
        return mongoose.Schema.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props.value} is not a valid objectId`,
    },
  },

  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true,
    validate: {
      validator: function (id) {
        return mongoose.Schema.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props.value} is not a valid objectId`,
    },
  },

  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Completed", "Not started", "In progress"],
    default: "Not started",
  },

  attachments: [
    {
      secure_url: {
        type: String,
      },
      public_id: {
        type: String,
      },
      asset_id: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("Task", taskSchema);

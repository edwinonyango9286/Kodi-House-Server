// Users sends applications from the app.
const mongoose = require("mongoose");

const applicationsSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    lowercase: true,
  },
  lastName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  property: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Property",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Schema.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
  ],

  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Unit",
    required: true,
    validate: {
      validator: function (id) {
        return mongoose.Schema.Types.ObjectId.isValid(id);
      },
      message: (props) => `${props.value} is not a valid objectId`,
    },
  },
  tourDate: {
    type: Date,
    required: true,
  },
  tourTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Declined"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Applications", applicationsSchema);

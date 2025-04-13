const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Property",
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
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
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props} is not a valid objectId`,
      },
    },

    category: {
      type: String,
      required: true,
      enum: ["Single", "Multi single"],
    },
    tag: {
      type: String,
      required: true,
      enum: [
        "Payment to caretaker",
        "Maintainance",
        "Utility Bills",
        "Repairs",
      ],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId(id);
        },
        message: (props) => `${props} is not a valid objectId.`,
      },
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      minleghth: 2,
      maxlength: 2000,
    },

    attachment: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);

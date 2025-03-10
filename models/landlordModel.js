const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const landlordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      lowercase: true,
    },
    secondName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      lowercase: true,
    },
    lastname: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 32,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 2,
      maxlength: 50,
      lowercase: true,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
    },
    idNumber: {
      type: Number,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["landlord"],
      default: "landlord",
    },
    avatar: {
      secure_url: {
        type: String,
        default:
          "https://www.hotelbooqi.com/wp-content/uploads/2021/12/128-1280406_view-user-icon-png-user-circle-icon-png.png",
      },
      public_id: {
        type: String,
        default:
          "https://www.hotelbooqi.com/wp-content/uploads/2021/12/128-1280406_view-user-icon-png-user-circle-icon-png.png",
      },
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "User",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "Property",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "Unit",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    tenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "Tenant",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applications",
        default: [],
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        default: [],
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        default: [],
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },

    landlordAccountStatus: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },

    termsAndConditionsAccepted: {
      type: Boolean,
      required: true,
    },
    termsAndConditionsAcceptedAt: {
      type: Date,
      default: Date.now(),
    },
    isAccountVerrified: {
      type: Boolean,
      default: false,
    },
    passwordChagedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

landlordSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

landlordSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

landlordSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("Landlord", landlordSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      minlength: 2,
      maxlength: 32,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 2,
      maxlength: 32,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: "tenant",
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Property",
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Unit",
    },
    avatar: {
      type: String,
      default:
        "https://www.hotelbooqi.com/wp-content/uploads/2021/12/128-1280406_view-user-icon-png-user-circle-icon-png.png",
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    refreshToken: {
      type: String,
      require: false,
      unique: true,
      trim: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChagedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

tenantSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

tenantSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

tenantSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("Tenant", tenantSchema);

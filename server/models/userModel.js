const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

var userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 6,
      maxlength: 254,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["tenant", "landlord"],
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
    passwordChagedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
module.exports = mongoose.model("User", userSchema);

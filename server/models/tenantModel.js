const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const tenantSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid ObjectId.`,
      },
    },

    firstName: {
      type: String,
      required: true,
      index: true,
      minlength: 2,
      maxlength: 32,
      trim: true,
    },
    secondName: {
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
      sparse: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    role: {
      type: String,
      default: "tenant",
    },

    moveInDate: {
      type: Date,
    },

    moveOutDate: {
      type: Date,
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
    password: {
      type: String,
      required: true,
      trim: true,
    },

    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    unit: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },

    refreshToken: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
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

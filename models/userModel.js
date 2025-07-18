const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
     createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         validate: {
           validator: (id) => {
             return mongoose.Types.ObjectId.isValid(id);
           },
           message: (props) => `${props} is not a valid object id.`,
         },
       },
    userName: {
      type: String,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    secondName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    twitterId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
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
    description:{
      type:String,
      trim:true,
      minlength:2,
      maxlength:50,
    },
    businessName: {
      type: String,
      trim: true,
      // minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    idNumber: {
      type: Number,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      secure_url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    moveInDate:{
      type:Date,
      default:null
    },
    moveOutDate:{
      type:Date,
      default:null
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
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
        validate: {
          validator: (id) => {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid ObjectId.`,
        },
      },
    ],

    // a single user will have a single role at a time
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid ObjectId.`,
      },
    },
    password: {
      type: String,
      select: false,
    },
    refreshToken: {
      type: String,
      trim: true,
      select: false,
      index: {
        unique: true,
        partialFilterExpression: { refreshToken: { $ne: null } },
      },
    },
    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    termsAndConditionsAccepted: {
      type: Boolean,
    },
    termsAndConditionsAcceptedAt: {
      type: Date,
      default: Date.now(),
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
  if (!this.isModified("password")) {return next();}
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);

const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const User = require("../models/userModel");
const validatePassword = require("../utils/validatePassword");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendMail = require("../utils/sendMails");
const ejs = require("ejs");
const { generateAccessToken } = require("../config/accessToken");
const { generateRefreshToken } = require("../config/refreshToken");
const bcrypt = require("bcrypt");

//create a tenant
const registerNewUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fileds." });
  }
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }
  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      message: "An account with this email address already exist.",
    });
  }
  const newUser = {
    name,
    email,
    password,
  };

  const activationToken = createActivationToken(newUser);
  const activationCode = activationToken.activationCode;
  const data = { newUser: { name: newUser.name }, activationCode };

  const html = await ejs.renderFile(
    path.join(__dirname, "../mail-templates/activation-mail.ejs"),
    data
  );

  await sendMail({
    email: newUser.email,
    subject: "Account Activation",
    template: "activation-mail.ejs",
    data,
  });

  res.status(201).json({
    success: true,
    message: `Please check your email:${newUser.email} to activate your account`,
    activationToken: activationToken.token,
    newUser: {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
    },
  });
});

//create activation token
const createActivationToken = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5min",
    }
  );
  return { token, activationCode };
};

const activateTenantAccount = asyncHandler(async (req, res) => {
  const { activationToken, activationCode } = req.body;

  if (!activationToken || !activationCode) {
    return res.status(400).json({
      message: "Please provide all the required fields.",
    });
  }

  let newUser;
  try {
    newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Activation token has expired." });
    }
    return res.status(400).json({ message: "Invalid activation token." });
  }

  if (newUser.activationCode !== activationCode) {
    return res.status(400).json({ message: "Invalid activation code." });
  }
  const { name, email, password } = newUser.user;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      message:
        "An account with this email address already exist. Login instead.",
    });
  }
  const user = await User.create({
    name,
    email,
    password,
    role: "tenant",
  });
  res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
    user,
  });
});

const activateLandlordAccount = asyncHandler(async (req, res) => {
  const { activationToken, activationCode } = req.body;
  if (!activationToken || !activationCode) {
    return res.status(400).json({
      message: "Please provide all the required fields.",
    });
  }

  let newUser;
  try {
    newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Activation token has expired." });
    }
    return res.status(400).json({ message: "Invalid activation token." });
  }
  if (newUser.activationCode !== activationCode) {
    return res.status(400).json({ message: "Invalid activation code" });
  }
  const { name, email, password } = newUser.user;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      message:
        "An account with this email address already exist. Login instead.",
    });
  }
  const user = await User.create({
    name,
    email,
    password,
    role: "landlord",
  });

  res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
    user,
  });
});

const activateAdminAccount = asyncHandler(async (req, res) => {
  const { activationToken, activationCode } = req.body;
  if (!activationToken || !activationCode) {
    return res.status(400).json({
      message: "Please provide all the required fields.",
    });
  }

  let newUser;
  try {
    newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Activation token has expired." });
    }
    return res.status(400).json({ message: "Invalid activation token." });
  }
  if (newUser.activationCode !== activationCode) {
    return res.status(400).json({ message: "Invalid activation code" });
  }
  const { name, email, password } = newUser.user;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      message:
        "An account with this email address already exist. Login instead.",
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "admin",
  });

  res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
    user,
  });
});

const loginTenant = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields." });
  }
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }

  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(403).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }

  if (user && !(await user.isPasswordMatched(password))) {
    res.status(403).json({ message: "Wrong email or password." });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    sameSite: "strict",
  });
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken: accessToken,
  });
});

const loginLandlord = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields." });
  }
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }

  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(403).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (user && user.role !== "landlord") {
    res.status(401).json({ message: "Not authorised." });
  }
  if (user && !(await user.isPasswordMatched(password))) {
    res.status(403).json({ message: "Wrong email or password." });
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    sameSite: "strict",
  });
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken: accessToken,
  });
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields." });
  }
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }

  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(403).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (user && user.role !== "admin") {
    res.status(401).json({ message: "Not authorised." });
  }
  if (user && !(await user.isPasswordMatched(password))) {
    res.status(403).json({ message: "Wrong email or password." });
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    sameSite: "strict",
  });
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken: accessToken,
  });
});

const handleRefreshToken = async (req) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("Refresh token missing. Please log in again.");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error("User not found. Please log in again.");
  }
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  if (user.id !== decoded.id) {
    throw new Error("Invalid refresh token. Please log in again.");
  }
  const newAccessToken = generateAccessToken(user._id);
  req.user = user;

  return newAccessToken;
};

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "Please fill in all the required fields." });
  }
  try {
    validateMongoDbId(_id);
  } catch (error) {
    return res.status(400).json({
      message: "We couldn't find an account associated with this id.",
    });
  }
  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    validatePassword(confirmPassword);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password and confirm password values do not match." });
  }

  const user = await User.findById(_id);
  if (!user) {
    return res.status(404).json({
      message: "We couldn't find an account associated with this id.",
    });
  }

  if (await user.isPasswordMatched(password)) {
    return res.status(400).json({
      message:
        "Please choose a new password that is different from your old one.",
    });
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    message:
      "Your password has been update. Proceed to log in with the new password.",
  });
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Please provide your email address." });
  }

  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  const token = await user.createPasswordResetToken();
  await user.save();
  const data = { user: { name: user.name }, token };
  const html = await ejs.renderFile(
    path.join(__dirname, "../mail-templates/reset-password-mail.ejs"),
    data
  );
  await sendMail({
    email: user.email,
    subject: "Password Reset Link",
    template: "reset-password-mail.ejs",
    data,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  try {
    validatePassword(password);
  } catch (error) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      message:
        "Something went wrong. Please try initiating the password reset process again.",
    });
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.json({
    message: "Password has been successfully reset. Proceed to login",
    user: { email: user.email, id: user._id },
  });
});

module.exports = {
  registerNewUser,
  activateLandlordAccount,
  activateTenantAccount,
  activateAdminAccount,
  loginTenant,
  loginLandlord,
  loginAdmin,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  handleRefreshToken,
};

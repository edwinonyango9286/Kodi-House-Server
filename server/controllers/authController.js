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
const crypto = require("crypto");

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

  return res.status(201).json({
    success: true,
    message: `An account activation code has been sent to ${newUser.email}. Please check it.`,
    newUser,
    activationToken: activationToken.token,
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

  return res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
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

  return res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
  });
});

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
  return res.status(201).json({
    success: true,
    message: "Your account has been activated. Proceed to log in.",
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
  user.tokenVersion += 1;
  await user.save();
  const accessToken = generateAccessToken(user._id, user.tokenVersion);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
  });
  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
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

  user.tokenVersion += 1;
  await user.save();
  const accessToken = generateAccessToken(user._id, user.tokenVersion);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
  });
  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    accessToken: accessToken,
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
  user.tokenVersion += 1;
  await user.save();
  const accessToken = generateAccessToken(user._id, user.tokenVersion);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
  });
  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    accessToken: accessToken,
  });
});

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (user.id !== decoded.id) {
      return res
        .status(403)
        .json({ message: "You're not logged in. Please log in to continue." });
    }

    const newAccessToken = generateAccessToken(user._id);
    req.user = user;

    return newAccessToken;
  } catch (error) {
    return res.status(403).json({
      message: "You're not logged in. Please log in to continue.",
    });
  }
});

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
        "Please choose a new password that is different from the old one.",
    });
  }
  user.password = password;
  await user.save();

  return res.status(200).json({
    message:
      "Your password has been update. Proceed to log in with the new password.",
  });
});

// send an email to the user with the password resent link and a token
const passwordResetToken = asyncHandler(async (req, res) => {
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
    path.join(__dirname, "../mail-templates/reset-password-token-mail.ejs"),
    data
  );
  await sendMail({
    email: user.email,
    subject: "Password Reset Link",
    template: "reset-password-token-mail.ejs",
    data,
  });
  console.log(token);
  return res.status(200).json({
    message: `A password reset link has been sent to ${user.email}. Please check it.`,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields." });
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
  if (await user.isPasswordMatched(password)) {
    return res.status(400).json({
      message:
        "Please choose a new password that is different from the old one.",
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  return res.json({
    message: "Your password has been successfully reset. Proceed to login.",
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie.refreshToken) {
    return res
      .status(401)
      .json({ message: "We could not find refresh token in cookies." });
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res
      .status(200)
      .json({ message: "You have successfully logged out." });
  }
  await User.findOneAndUpdate(
    { refreshToken },
    {
      refreshToken: "",
    }
  );
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "You have successfully logged out." });
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
  passwordResetToken,
  resetPassword,
  handleRefreshToken,
  logout,
};

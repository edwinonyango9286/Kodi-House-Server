const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const User = require("../models/userModel");
const validatePassword = require("../utils/validatePassword");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendMail = require("../utils/sendMails");
const ejs = require("ejs");
const { generateToken } = require("../config/jwtToken");

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
  validatePassword(password);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      message: "An account with this email already exist. Login instead.",
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
      message: "An account with this email already exist. Login instead.",
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
      message: "An account with this email already exist. Login instead.",
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
  validatePassword(password);

  const user = await User.findOne({ email });
  if (user && (await user.isPasswordMatched(password))) {
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(403).json({ message: "Wrong email or password." });
  }
});

module.exports = {
  registerNewUser,
  activateLandlordAccount,
  activateTenantAccount,
};

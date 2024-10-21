const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const User = require("../models/userModel");
const validatePassword = require("../utils/validatePassword");

//create a tenant
const registerTenant = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fileds." });
  }
  validatePassword(password);
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    const newUser = await User.create({
      name,
      email,
      password,
      role: "tenant",
    });
    return res.status(201).json(newUser);
  } else {
    return res.status(409).json({
      message: "An account with this email already exist. Login instead.",
    });
  }
});

//create a landlord
const registerLandlord = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fileds." });
  }
  validatePassword(password);
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    const newUser = await User.create({
      name,
      email,
      password,
      role: "landlord",
    });
    return res.status(201).json(newUser);
  } else {
    return res.status(409).json({
      message: "An account with this email already exist. Login instead.",
    });
  }
});




module.exports = { registerTenant, registerLandlord };

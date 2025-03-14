const expressAsyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const { generateAccessToken } = require("../config/accessToken");
const { generateRefreshToken } = require("../config/refreshToken");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

// register a super admin that will register other users
const registerSuperAdmin = expressAsyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // validate email
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide a valid email address.",
      });
    }
    validatePassword(password);
    // check for existing admin
    const existingSuperAdmin = await Admin.findOne({ email });
    if (existingSuperAdmin) {
      return res.status(409).json({
        status: "FAILED",
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }
    const superAdmin = await Admin.create({ ...req.body, role: "superAdmin" });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Super admin account created successfully.",
      data: superAdmin,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

const signInSuperAdmin = expressAsyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    // check for required fields
    if (!email || !password) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide a valid email address.",
      });
    }
    validatePassword(password);
    logger.error(validatePassword(password));
    const superAdmin = await Admin.findOne({ email }).select("+password");
    if (!superAdmin) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found." });
    }
    // check if the user is a super admin
    if (superAdmin && superAdmin.role !== "superAdmin") {
      return res
        .status(401)
        .json({ status: "FAILED", message: "Not authorised." });
    }
    // check if the provided password matches the stored password
    if (
      superAdmin &&
      superAdmin.role === "superAdmin" &&
      !(await superAdmin.isPasswordMatched(password))
    ) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Wrong password or email." });
    }
    // assign an accessToken and refresh token to the admin
    const accessToken = generateAccessToken(superAdmin._id);
    const refreshToken = generateRefreshToken(superAdmin._id);
    // save refresh token in the database
    superAdmin.refreshToken = refreshToken;
    await superAdmin.save();

    // send cookies with the refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    });
    // remove password for the super admin object
    const superAdminData = { ...superAdmin.toObject() };
    delete superAdminData.password;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sign in success.",
      superAdmin: superAdminData,
      accessToken: accessToken,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// admin registers a user
const registerAdminUser = expressAsyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fileds.",
      });
    }
    if (!emailValidator.validate(email)) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Please provide a valid email." });
    }
    const adminUser = await Admin.findOne({ email });
    if (adminUser) {
      return res.status(409).json({
        status: "FAILED",
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }
    return res.status(201).json({
      status: "SUCCESS",
      message: "Admin user added successfully.",
      data: adminUser,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

const refreshAdminAccessToken = expressAsyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(404).json({
        status: "FAILED",
        message: "Session expired. Please login to continue.",
      });
    }

    // get admin with the refresh token
    const adminUser = await Admin.findOne({ refreshToken });
    if (!adminUser) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid refresh token.",
      });
    }
    // verify if the refresh token is a valid jwt token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (adminUser.id !== decoded.id) {
      return res.status(400).json({
        status: "FAILED",
        message: "Unauthorized access. Please log in to continue.",
      });
    }
    const newAccessToken = generateAccessToken(adminUser._id);
    req.admin = adminUser;
    return newAccessToken;
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  registerSuperAdmin,
  registerAdminUser,
  signInSuperAdmin,
  refreshAdminAccessToken,
};

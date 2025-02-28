const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMails");
const { generateAccessToken } = require("../config/accessToken");
const { generateRefreshToken } = require("../config/refreshToken");
const crypto = require("crypto");
const Landlord = require("../models/landlordModel");
const logger = require("../utils/logger");
const expressAsyncHandler = require("express-async-handler");

// landlord should not deleted their own account=> this function should not be provided in version 1 of the application

//register a landlord
const registerNewLandlord = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, termsAndConditionsAccepted } = req.body;
    // check for required fields
    if (!name || !email || !password || !termsAndConditionsAccepted) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // validate email using email validator
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide a valid email address.",
      });
    }

    validatePassword(password);
    // check if the landlord already exist in the database using email.
    const landlord = await Landlord.findOne({ email });
    if (landlord) {
      return res.status(409).json({
        status: "FAILED",
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }
    const newLandlord = {
      name,
      email,
      password,
      termsAndConditionsAccepted,
    };
    const activationToken = createActivationToken(newLandlord);
    const activationCode = activationToken.activationCode;
    const data = { newLandlord: { name: newLandlord?.name }, activationCode };

    await sendMail({
      email: newLandlord?.email,
      subject: "Account Activation",
      template: "landlord-activation-mail.ejs",
      data,
    });
    return res.status(200).json({
      success: true,
      message: `An account activation code has been sent to ${newLandlord?.email}. Please check it.`,
      activationToken: activationToken?.token,
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

//create landlord activation token
const createActivationToken = (landlord) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      landlord,
      activationCode,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5min",
    }
  );
  return { token, activationCode };
};

const activateLandlordAccount = asyncHandler(async (req, res) => {
  try {
    const { activationToken, activationCode } = req.body;
    if (!activationToken || !activationCode) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    let newLandlord;
    try {
      newLandlord = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ status: "FAILED", message: "Activation token has expired." });
      }
      return res
        .status(400)
        .json({ status: "FAILED", message: "Invalid activation token." });
    }

    if (newLandlord.activationCode !== activationCode) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Invalid activation code" });
    }
    const { name, email, password, termsAndConditionsAccepted } =
      newLandlord.landlord;

    const existingLandlord = await Landlord.findOne({ email });
    if (existingLandlord) {
      return res.status(409).json({
        status: "FAILED",
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }
    const landlord = await Landlord.create({
      name,
      email,
      password,
      termsAndConditionsAccepted,
      role: "landlord",
    });

    return res.status(201).json({
      status: "SUCCESS",
      message:
        "Your account has been successfully activated. Please proceed to log in.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

const sigInLandlord = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
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
    const landlord = await Landlord.findOne({ email }).select("+password");

    if (!landlord) {
      return res.status(403).json({
        status: "FAILED",
        message:
          "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
      });
    }
    if (landlord && landlord.role !== "landlord") {
      return res.status(401).json({ message: "Not authorised." });
    }
    if (
      landlord &&
      landlord.role === "landlord" &&
      !(await landlord.isPasswordMatched(password))
    ) {
      res.status(403).json({ message: "Wrong email or password." });
    }
    const accessToken = generateAccessToken(landlord._id);
    const refreshToken = generateRefreshToken(landlord._id);
    landlord.refreshToken = refreshToken;
    await landlord.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      // refresh token will be removed from cookies in 7 days.
      maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    });

    // remove password from the landlord object
    const landlordData = { ...landlord.toObject() };
    delete landlordData.password;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sign in success.",
      landlord: landlordData,
      accessToken: accessToken,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// get the landlord
const me = asyncHandler(async (req, res) => {
  try {
    const me = await Landlord.findById({ _id: req.landlord._id });
    if (!me) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: me });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// Generates new access token from refresh token for the landlord
const refreshLandlordAccesToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({
        status: "FAILED",
        // if refresh token is missing from cookies it means the refresh token has expired has been removed from cookies
        message: "Session Expired. Please log in to continue.",
      });
    }
    const landlord = await Landlord.findOne({ refreshToken });
    if (!landlord) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Invalid refresh token." });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (landlord.id !== decoded.id) {
      return res.status(400).json({
        status: "FAILED",
        message: "Unauthorized access. Please log in to continue.",
      });
    }
    const newAccessToken = generateAccessToken(landlord._id);
    req.landlord = landlord;
    return newAccessToken; // Return the new access token
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please fill in all the required fields.",
      });
    }
    validatePassword(password);
    validatePassword(confirmPassword);

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "FAILED",
        message: "Password and confirm password values do not match.",
      });
    }
    const landlord = await Landlord.findById(req.landlord._id).select(
      "+password"
    );
    if (!landlord) {
      return res.status(404).json({
        message: "Landlord not found.",
      });
    }
    if (await landlord.isPasswordMatched(password)) {
      return res.status(400).json({
        status: "FAILED",
        message:
          "Please choose a new password that is different from the old one.",
      });
    }
    landlord.password = password;
    await landlord.save();

    // remove password from landlord object
    const landlordData = { ...landlord.toObject() };
    delete landlordData.password;

    return res.status(200).json({
      status: "SUCCESS",
      message:
        "Your password has been update. Proceed to log in with the new password.",
      data: landlordData,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// send an email to the landlord with the password resent link and a token
const passwordResetToken = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide your email address",
      });
    }

    if (!emailValidator.validate(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address." });
    }

    const landlord = await Landlord.findOne({ email });
    if (!landlord) {
      return res.status(404).json({
        status: "FAILED",
        message:
          "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
      });
    }
    const token = await landlord.createPasswordResetToken();
    // console.log token for test
    console.log(token);
    await landlord.save();
    const data = { landlord: { name: landlord.name }, token };
    await sendMail({
      email: landlord.email,
      subject: "Password Reset Link",
      template: "landlord-reset-password-token-mail.ejs",
      data,
    });
    return res.status(200).json({
      status: "SUCCESS",
      message: `A password reset link has been sent to ${landlord.email}. Please check your email inbox and follow the instructions to reset your password.`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    validatePassword(password);
    validatePassword(confirmPassword);
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password values do not match.",
      });
    }
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const landlord = await Landlord.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");
    if (!landlord) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid password reset token.",
      });
    }
    if (await landlord.isPasswordMatched(password)) {
      return res.status(400).json({
        status: "FAILED",
        message:
          "Please choose a new password that is different from the old one.",
      });
    }
    landlord.password = password;
    landlord.passwordResetToken = undefined;
    landlord.passwordResetExpires = undefined;
    await landlord.save();
    return res.json({
      status: "SUCCESS",
      message: "Your password has been successfully reset. Proceed to login.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.refreshToken) {
      return res.status(401).json({
        status: "FAILED",
        message: "We could not find refresh token in cookies.",
      });
    }
    const refreshToken = cookie.refreshToken;
    const landlord = await Landlord.findOne({ refreshToken });
    if (!landlord) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(200).json({
        status: "SUCCESS",
        message: "You have successfully logged out.",
      });
    }
    await Landlord.findOneAndUpdate(
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
    return res.status(200).json({
      status: "SUCCESS",
      message: "You have successfully logged out.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// so far so good => any error to be reported asap.

module.exports = {
  registerNewLandlord,
  activateLandlordAccount,
  sigInLandlord,
  updatePassword,
  passwordResetToken,
  resetPassword,
  refreshLandlordAccesToken,
  logout,
  me,
};

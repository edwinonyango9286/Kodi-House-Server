const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMails");
const { generateAccessToken } = require("../config/accessToken");
const { generateRefreshToken } = require("../config/refreshToken");
const crypto = require("crypto");
const User = require("../models/userModel");
const logger = require("../utils/logger");
const _ = require("lodash");
const Role = require("../models/roleModel");
const sendSMS = require("../utils/sendSms");

//create user activation token
const createActivationToken = (user) => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const token = jwt.sign({user,activationCode}, process.env.ACTIVATION_SECRET,{expiresIn: "5min"});
  return { token, activationCode };
};

//  Register a new user
const registerNewUser = asyncHandler(async (req, res, next) => {
  try {
    const { userName, email, password, termsAndConditionsAccepted } = req.body;
    // check for required fields
    if (!userName || !email || !password || !termsAndConditionsAccepted) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields."});
    }
    // validate user email
    if (!emailValidator.validate(email)) {
      return res.status(400).json({status: "FAILED",message: "Please provide a valid email address."});
    }
    validatePassword(password);
    // check if the user already exist in the database using email.
    const user = await User.findOne({ email });
    if (user) {return res.status(409).json({status: "FAILED",message:"An account with this email address already exists. Please use a different email address or log in to your existing account.",})}
    const newUser = {userName,email,password,termsAndConditionsAccepted};
    const activationToken = createActivationToken(newUser);
    const activationCode = activationToken.activationCode;
    const data = {newUser: { userName: newUser?.userName },activationCode};
    await sendMail({email: newUser?.email,subject: "Account Activation",template: "account-activation-mail.ejs",data});
    return res.status(200).json({success:"SUCCESS", message: `An account activation code has been sent to ${newUser?.email}. Please check it.`,  data:{ activationToken: activationToken?.token, email:newUser.email } });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});


// General function to activate user accounts
const activateUserAccount = asyncHandler(async (req, res, next, roleName) => {
  try {
    const { activationToken, activationCode } = req.body;
    if (!activationToken || !activationCode) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields."});
    }
    let newUser;
    try {
      newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ status: "FAILED", message: "Activation token has expired." });
      }
      return res.status(400).json({ status: "FAILED", message: "Invalid activation token." });
    }
    if (newUser.activationCode !== activationCode) {
      return res.status(400).json({ status: "FAILED", message: "Invalid activation code" });
    }
    const { userName, email, password, termsAndConditionsAccepted } =
      newUser.user;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({status: "FAILED",message:"An account with this email address already exists. Please use a different email address or log in to your existing account."});
    }

    // Fetch the role ObjectId based on the role name
    const role = await Role.findOne({ name: _.startCase(_.toLower(roleName)) });
    if (!role) { return res.status(404).json({status: "FAILED",message: "Role not found."})}
    
    const user = await User.create({
    userName: _.startCase(_.toLower(userName)),email,password,termsAndConditionsAccepted,role: role._id});
    return res.status(200).json({status: "SUCCESS",message:"Your account has been successfully activated. Please proceed to log in.",});
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

//case admin
const activateAdminAccount = (req, res, next) =>
  activateUserAccount(req, res, next, "Admin");
// case landlord
const activateLandlordAccount = (req, res, next) =>
  activateUserAccount(req, res, next, "Landlord");
// case tenant
const activateTenantAccount = (req, res, next) =>
  activateUserAccount(req, res, next, "Tenant");

// for a landlord to start using his/her account the landlord should be verified
const verifyLandlordAccount = asyncHandler(async (req, res) => {
  try {
    const { landlordId } = req.params;
    validateMongoDbId(landlordId);
    const verifiedLandlord = await User.findOneAndUpdate(
      {
        _id: landlordId,
      },
      {
        isAccountVerrified: true,
      }
    );
    if (!verifiedLandlord) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Landlord not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Landlord account activated successfully.",
      data: verifiedLandlord,
    });
  } catch (error) {
    logger.error({ message: error.message });
    return res.status(500).json({ message: error.message });
  }
});

// General sign-in function
const signInUser = asyncHandler(async (req, res, next, expectedRole) => {
  try {
    const { email, password } = req.body;
    // Check for required fields
    if (!email || !password) { return res.status(400).json({status: "FAILED", message: "Please provide all the required fields.",});}
    // Validate email format
    if (!emailValidator.validate(email)) {return res.status(400).json({ status: "FAILED",message: "Please provide a valid email address.",});}
    // Find the user by email => also ensure that user whose accounts are not deleted are the only ones who can log in
    const user = await User.findOne({ email,isDeleted: false,deletedAt: null,}).select("+password").populate({ path: "role", select: "name" });
    // Check if user exists and has the expected role
    if (!user || user.role.name !== expectedRole) {return res.status(404).json({status: "FAILED",message: `${expectedRole} account not found or not authorized.`});}

    // Check password
    if (!(await user.isPasswordMatched(password))) {return res.status(401).json({status: "FAILED",message: "Wrong email or password."});}

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
    });

    // Remove sensitive data
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    return res.status(200).json({status: "SUCCESS", message: `${expectedRole} signed in successfully.`,data: userData,accessToken,});
    
  } catch (error) {
    next(error);
  }
});

// Sign in Admin
const signInAdmin = (req, res, next) => signInUser(req, res, next, "Admin");
// Sign in Landlord
const signInLandlord = (req, res, next) =>
  signInUser(req, res, next, "Landlord");
// Sign in Tenant
const signInTenant = (req, res, next) => signInUser(req, res, next, "Tenant");
// Generates new access token from refresh token for the landlord
const refreshUserAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({
        status: "FAILED",
        // if refresh token is missing from cookies it means the refresh token has expired from the browser cookies
        message: "Session expired. Please log in to continue.",
      });
    }
    const user = await User.findOne({ refreshToken }).select("+refreshToken");
    if (!user) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Invalid refresh token." });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (user.id !== decoded.id) {
      return res.status(400).json({
        status: "FAILED",
        message: "Unauthorized access. Please log in to continue.",
      });
    }
    const newAccessToken = generateAccessToken(user._id);
    req.user = user;
    return newAccessToken; // Return the new access token
  } catch (error) {
    next(error);
  }
});

// update password
const updatePassword = asyncHandler(async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ status: "FAILED", message: "Please fill in all the required fields.",});
    }
    validatePassword(currentPassword);
    validatePassword(newPassword);
    validatePassword(confirmNewPassword);

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ status: "FAILED", message: "Password and confirm password values do not match.",});
    }
    const user = await User.findById(req.user._id).select("+password");

    if (!user) { return res.status(404).json({ status: "FAILED",message: "User not found.",});}
    // check if the current password is the same as the stored password
    if (!(await user.isPasswordMatched(currentPassword))) {return res.status(400).json({ status: "FAILED", message: "Current password is incorrect." });}

    // check if the new password is the same as the stored password
    if (await user.isPasswordMatched(newPassword)) {
      return res.status(400).json({status: "FAILED",message:"Please choose a new password that is different from the old password.",});
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({status: "SUCCESS", message:"Your password has been successfully updated.Please proceed to sign in with the new password.",});
  } catch (error) {
    next(error);
  }
});



// send an email to the user with the password reset link and a token
const passwordResetToken = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({status: "FAILED",message: "Please provide your email address.",});
    }
    if (!emailValidator.validate(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    const user = await User.findOne({ email });
      if (!user) { return res.status(404).json({status: "FAILED",message:"We couldn't find an account associated with this email address. Please double-check your email address and try again.",});
    }
    const token = await user.createPasswordResetToken();
    await user.save();
    const data = { user: { userName: user.userName }, token };
    await sendMail({ email: user.email, subject: "Password Reset Link", template: "reset-password-token-mail.ejs", data,});
    return res.status(200).json({ status: "SUCCESS", message: `A password reset link has been sent to ${user.email}. Please check your email inbox and follow the instructions to reset your password.`});
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) { return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields.",});}
    validatePassword(password);
    validatePassword(confirmPassword);
    if (password !== confirmPassword) { return res.status(400).json({ status: "FAILED", message: "Password and confirm password values do not match.",});}
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() },}).select("+password");
    console.log(user,"=>user")
    if (!user) { return res.status(400).json({ status: "FAILED", message: "Invalid password reset token.",});}
    if (await user.isPasswordMatched(password)) { return res.status(400).json({ status: "FAILED", message:"Please choose a new password that is different from the old one.",});}
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.json({  status: "SUCCESS", message:"Your password has been successfully reset. Please proceed to sign in with the new password.",});
  } catch (error) {
    next(error);
  }
});

const logout = asyncHandler(async (req, res,next) => {
  try {
    const cookie = req.cookies;
    console.log(cookie,"=>Cookies")
    if (!cookie.refreshToken) { return res.status(401).json({status: "FAILED",message: "We could not find refresh token in cookies.",}); }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken }).select("+refreshToken");
    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res.status(200).json({ status: "SUCCESS",message: "You have successfully logged out.",});
    }
    await User.findOneAndUpdate(
      { refreshToken },
      {
        refreshToken: null,
      }
    ).select("+refreshToken");
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({status: "SUCCESS",message: "You've successfully logged out.",});
  } catch (error) {
    next(error)
  }
});

// so far so good => any error to be reported asap.

module.exports = {registerNewUser,activateAdminAccount,activateTenantAccount,activateLandlordAccount,refreshUserAccessToken,signInAdmin,signInTenant,signInLandlord,updatePassword,passwordResetToken,resetPassword,verifyLandlordAccount,logout,};

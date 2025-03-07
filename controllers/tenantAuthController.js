const asyncHandler = require("express-async-handler");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const Tenant = require("../models/tenantModel");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMails");
const { generateAccessToken } = require("../config/accessToken");
const logger = require("../utils/logger");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const _ = require("lodash");

// generate a random password for the tenant
const generateRandomPassword = (length = 8) => {
  if (length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password length must be at least 8 characters.",
    });
  }

  const lowerCaseChars = "abcdefghijklmnopqrstuvwxyz";
  const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "@$!%*?&";

  // Ensure the password contains at least one character from each category
  const passwordArray = [
    lowerCaseChars[Math.floor(Math.random() * lowerCaseChars.length)],
    upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  // Fill the rest of the password length with random characters from all categories
  const allChars = lowerCaseChars + upperCaseChars + digits + specialChars;
  for (let i = passwordArray.length; i < length; i++) {
    passwordArray.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the password array to ensure randomness
  const shuffledPassword = passwordArray
    .sort(() => Math.random() - 0.5)
    .join("");

  return shuffledPassword;
};

// add a tenant=>a tenant is added by a landlord
const addATenant = asyncHandler(async (req, res, next) => {
  try {
    const { firstName, secondName, email, phoneNumber } = req.body;
    // Validate required fields
    if (!firstName || !secondName || !email || !phoneNumber) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    validatePhoneNumber(phoneNumber);
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide a valid email address.",
      });
    }

    // Check for existing tenant
    const existingTenant = await Tenant.findOne({ email });

    // If a tenant exists and the account is marked as deleted
    if (existingTenant) {
      if (existingTenant.isDeleted) {
        // Reactivate the existing tenant account
        existingTenant.firstName = _.startCase(_.toLower(firstName));
        existingTenant.secondName = _.startCase(_.toLower(secondName));
        existingTenant.phoneNumber = phoneNumber;
        const password = generateRandomPassword(8);
        existingTenant.password = password; //validate the password
        existingTenant.isDeleted = false; // Reactivate account
        (existingTenant.deletedAt = null),
          (existingTenant.accountStatus = "Active"); // Set account status to active
        await existingTenant.save();

        // Send email to the reactivated tenant informing them that their account has been reactivated successfully
        const existingTenantData = {
          existingTenant: { firstName, email, password }, // Use the stored password
        };
        const data = {
          email: existingTenant.email,
          subject: "Tenant Sign In Credentials.",
          template: "reactivated-tenant-sign-in-credentials.ejs",
          data: existingTenantData,
        };
        await sendMail(data);

        // remove password and refresh token from exisiting tenant
        const tenantWithoutPassword = { ...existingTenant.toObject() };
        delete tenantWithoutPassword.password,
          delete tenantWithoutPassword.refreshToken;

        return res.status(200).json({
          status: "SUCCESS",
          message: "Tenant account reactivated successfully.",
          data: tenantWithoutPassword,
        });
      } else {
        // If the account is active, return an error
        logger.error("Email already exists.");
        return res.status(400).json({
          status: "FAILED",
          message:
            "An account with this email address already exists. Please use a different email address or log in to your existing account.",
        });
      }
    }

    // If no existing tenant, create a new one
    const password = generateRandomPassword(8); // Store the generated password for the new tenant
    const addedTenant = await Tenant.create({
      ...req.body,
      landlord: req.landlord._id,
      password: password, // Set the password
      // chanhe the first letter of the names to uppercase
      firstName: _.startCase(_.toLower(firstName)),
      secondName: _.startCase(_.toLower(secondName)),
    });

    // Send the sign-in credentials to the tenant
    if (addedTenant) {
      const tenantData = {
        addedTenant: { firstName, email, password }, // Use the stored password
      };
      const data = {
        email: addedTenant.email,
        subject: "Tenant Sign In Credentials.",
        template: "new-tenant-sign-in-credentials.ejs",
        data: tenantData,
      };
      await sendMail(data);
    }

    // remove password from the tenant and refresh token from the response
    const tenantData = { ...addedTenant.toObject() };
    delete tenantData.password;
    delete tenantData.refreshToken;

    return res.status(201).json({
      status: "SUCCESS",
      message: "Tenant added successfully.",
      data: tenantData,
    });
  } catch (error) {
    logger.error("Error adding tenant:", error);
    next(error);
  }
});

const SignInTenant = asyncHandler(async (req, res) => {
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
  const tenant = await Tenant.findOne({ email });
  if (!tenant) {
    return res.status(403).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (tenant && !(await tenant.isPasswordMatched(password))) {
    res.status(403).json({ message: "Wrong email or password." });
  }

  const accessToken = generateAccessToken(tenant._id);
  const refreshToken = generateRefreshToken(tenant._id);
  tenant.refreshToken = refreshToken;
  await tenant.save();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
  });
  return res.status(200).json({
    _id: tenant._id,
    name: tenant.name,
    email: tenant.email,
    role: tenant.role,
    avatar: tenant.avatar,
    accessToken: accessToken,
  });
});

const refreshTenantAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({
      status: "FAILED",
      message: "Refresh token is missing from cookies.",
    });
  }
  const tenant = await Tenant.findOne({ refreshToken });
  if (!tenant) {
    return res
      .status(401)
      .json({ status: "FAILED", message: "Invalid refresh token." });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (tenant.id !== decoded.id) {
      return res.status(403).json({
        status: "FAILED",
        message: "Unauthorized access. Please log in again.",
      });
    }
    const newAccessToken = generateAccessToken(tenant._id);
    req.tenant = tenant;
    return newAccessToken; // Return new access token
  } catch (error) {
    return res.status(403).json({
      status: "FAILED",
      message: "Invalid or expired refresh token. Please log in again.",
    });
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.tenant;
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
  const tenant = await Tenant.findById(_id);
  if (!tenant) {
    return res.status(404).json({
      message: "We couldn't find an account associated with this id.",
    });
  }
  if (await tenant.isPasswordMatched(password)) {
    return res.status(400).json({
      message:
        "Please choose a new password that is different from the old one.",
    });
  }
  tenant.password = password;
  await tenant.save();

  return res.status(200).json({
    message:
      "Your password has been update. Proceed to log in with the new password.",
  });
});

const passwordResetToken = asyncHandler(async (req, res) => {
  try {
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

    const tenant = await Tenant.findOne({ email });
    if (!tenant) {
      return res.status(404).json({
        message:
          "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
      });
    }
    const token = await tenant.createPasswordResetToken();
    await tenant.save();
    const data = { tenant: { name: tenant.name }, token };

    await sendMail({
      email: tenant.email,
      subject: "Password Reset Link",
      template: "tenant-reset-password-token-mail.ejs",
      data,
    });

    console.log(token);
    return res.status(200).json({
      message: `A password reset link has been sent to ${tenant.email}. Please check your email inbox and follow the instructions to reset your password.`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.refreshToken) {
      return res.status(401).json({
        status: "FAILED",
        message: "Refresh token is missing from cookies.",
      });
    }
    const refreshToken = cookie.refreshToken;
    const tenant = await Tenant.findOne({ refreshToken });
    if (!tenant) {
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
    // remove refresh token from the tenant document
    await Tenant.findOneAndUpdate(
      { refreshToken },
      {
        refreshToken: null,
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

const deleteATenant = asyncHandler(async (req, res) => {
  try {
    const { tenantId } = req.params;
    const deletedTenant = await Tenant.findOneAndUpdate(
      { landlord: req.landlord._id, _id: tenantId },
      // update three fields => isDeleted set to true, deletedAt, accountStatus is set to disabled.
      {
        isDeleted: true,
        deletedAt: Date.now(),
        accountStatus: "Disabled",
      },
      {
        new: true,
      }
    );

    if (!deletedTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant Account deleted successfully.",
      data: deletedTenant,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  addATenant,
  SignInTenant,
  deleteATenant,
  updatePassword,
  refreshTenantAccessToken,
  passwordResetToken,
  logout,
};

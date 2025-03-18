const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// access new access token should only be generated if the there is an access token
const verifyUserToken = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req?.headers?.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    return res.status(401).json({
      status: "FAILED",
      message: "Authorization header missing. Please log in to continue.",
    });
  }
  const accessToken = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "FAILED",
        message: "Invalid access token. Please log in to continue.",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      try {
        const newAccessToken = await refreshLandlordAccesToken(req, res); // Get new access token
        req.headers.authorization = `Bearer ${newAccessToken}`; // Set new access token in headers
        next(); // Call next to continue to the next middleware/route handler
      } catch (err) {
        return res.status(403).json({
          status: "FAILED",
          message: "Failed to refresh access token. Please log in to continue.",
        });
      }
    } else {
      next(error);
    }
  }
});

// ensures the user is an admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const admin = await User.findOne({ email });
  if (!admin) {
    return res.status(404).json({
      status: "FAILED",
      message:
        "We couldn't find an admin account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (admin.role.name !== "Admin") {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Not authorized." });
  }
  next();
});

const isTenant = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const tenant = await User.findOne({ email });
  if (!tenant) {
    return res.status(404).json({
      status: "FAILED",
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (tenant.role.name !== "Tenant") {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Not authorized." });
  }
  if (tenant.status === "Disabled") {
    return res.status(403).json({
      status: "FAILED",
      message: "Your account has been Disabled.",
    });
  }
  next();
});

// ensures the landlord is a valid landlord => This is achieved by checking landlord role, landlord account status landlord account verification status
const isLandlord = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const landlord = await User.findOne({ email });
  if (!landlord) {
    return res.status(404).json({
      status: "FAILED",
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (landlord.role.name !== "Landlord") {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Not authorized." });
  }
  if (landlord.status === "Disabled") {
    return res.status(403).json({
      status: "FAILED",
      message: "Your account has been deactivated.",
    });
  }
  next();
});

module.exports = {
  verifyUserToken,
  isAdmin,
  isTenant,
  isLandlord,
};

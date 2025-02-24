const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Landlord = require("../models/landlordModel");
const {
  refreshLandlordAccesToken,
} = require("../controllers/landlordAuthController");
const Tenant = require("../models/tenantModel");
const Admin = require("../models/adminModel");
const {
  refreshTenantAccessToken,
} = require("../controllers/tenantAuthController");

// Auth middleware for landlord
// access new access token should only be generated if the there is an access token
const landlordAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req?.headers?.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    return res.status(401).json({
      message: "Authorization header missing. Please log in to continue.",
    });
  }
  const accessToken = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const landlord = await Landlord.findById(decoded.id);
    if (!landlord) {
      return res.status(401).json({
        message: "Invalid access token. Please log in to continue.",
      });
    }
    req.landlord = landlord;
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
          message: "Failed to refresh access token. Please log in to continue.",
        });
      }
    } else {
      return res.status(500).json({
        message: "Internal server error. Please try again in a moment.",
      });
    }
  }
});

// Auth middleware for tenants
const tenantAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req?.headers?.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    return res.status(401).json({
      message:
        "Authorization header missing or invalid. Please log in to continue.",
    });
  }
  const accessToken = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const tenant = await Tenant.findById(decoded.id);
    if (!tenant) {
      return res.status(401).json({
        message: "Invalid access token. Please log in to continue.",
      });
    }
    req.tenant = tenant;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      try {
        const newAccessToken = await refreshTenantAccessToken(req, res);
        req.headers.authorization = `Bearer ${newAccessToken}`;
        next();
      } catch (err) {
        return res.status(403).json({
          message: "Failed to refresh token. Please log in to continue.",
        });
      }
    } else {
      return res.status(500).json({
        message: "Internal server error. Please try again later.",
      });
    }
  }
});

// auth middleware for admin
const adminAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req?.headers?.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    return res.status(401).json({
      message:
        "Authorization header missing or invalid. Please log in to continue.",
    });
  }
  const accessToken = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        message: "Invalid access token. Please log in to continue.",
      });
    }
    req.admin = admin;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      try {
        const newAccessToken = await refreshAccesToken(req, res);
        req.headers.authorization = `Bearer ${newAccessToken}`;
        next();
      } catch (err) {
        return res.status(403).json({
          message: "Failed to refresh token. Please log in to continue.",
        });
      }
    } else {
      return res.status(500).json({
        message: "Internal server error. Please try again later.",
      });
    }
  }
});

// ensures the user is an admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.admin;
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(404).json({
      message:
        "We couldn't find an admin account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (admin.role !== "admin") {
    return res.status(403).json({ message: "Not authorized." });
  }
  next();
});
const isTenant = asyncHandler(async (req, res, next) => {
  const { email } = req.tenant;
  const tenant = await Tenant.findOne({ email });
  if (!tenant) {
    return res.status(404).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (tenant.role !== "tenant") {
    return res.status(403).json({ message: "Not authorized." });
  }
  next();
});

// ensures the user is a landlord and landlord status is active
const isLandlord = asyncHandler(async (req, res, next) => {
  const { email } = req.landlord;
  const landlord = await Landlord.findOne({ email });
  if (!landlord) {
    return res.status(404).json({
      status: "FAILED",
      message:
        "We couldn't find a landlord account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (landlord.role !== "landlord") {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Not authorized." });
  }
  if (landlord.landlordState === "Inactive") {
    return res.status(403).json({
      status: "FAILED",
      message: "Your account has been deactivated.",
    });
  }
  if (landlord.landlordState === "Deleted") {
    return res.status(403).json({
      message: "Your account has been deleted.",
    });
  }
  next();
});

module.exports = {
  isAdmin,
  landlordAuthMiddleware,
  tenantAuthMiddleware,
  adminAuthMiddleware,
  isLandlord,
  isTenant,
};

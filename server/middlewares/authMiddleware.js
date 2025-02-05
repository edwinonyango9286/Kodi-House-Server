const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Landlord = require("../models/landlordModel");
const { refreshAccesToken } = require("../controllers/landlordAuthController");
const Tenant = require("../models/tenantModel");
const Admin = require("../models/adminModel");

const authMiddleware = asyncHandler(async (req, res, next) => {
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
    const landlord = await Landlord.findById(decoded.id);

    if (!landlord || landlord.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        message: "Invalid token or token version. Please log in to continue.",
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

const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.admin;
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(404).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (admin.role !== "admin") {
    return res.status(403).json({ message: "Not authorized." });
  }
  next();
});

const isLandlord = asyncHandler(async (req, res, next) => {
  const { email } = req.landlord;
  const landlord = await Landlord.findOne({ email });
  if (!landlord) {
    return res.status(404).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }
  if (landlord.role !== "landlord") {
    return res.status(403).json({ message: "Not authorized." });
  }
  next();
});

module.exports = { isAdmin, authMiddleware, isLandlord, isTenant };

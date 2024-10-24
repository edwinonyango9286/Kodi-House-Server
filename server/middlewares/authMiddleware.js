const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = asyncHandler(async (req, res, next) => {
  if (
    !req?.headers?.authorization ||
    !req?.headers?.authorization?.startsWith("Bearer")
  ) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }

  const token = req?.headers?.authorization?.split(" ")[1];

  //   try {
  const decoded = jwt.verify(token, process.env.PASSWORD_UPDATE_SECRET);
  const user = await User.findById(decoded?.id);
  if (!user) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }
  req.user = user;
    next();
    
    
  //   } catch (error) {
  //     if (
  //       error.name === "JsonWebTokenError" ||
  //       error.name === "TokenExpiredError"
  //     ) {
  //       return res
  //         .status(401)
  //         .json({
  //           message: "You're not logged in. Please log in to continue.",
  //         });
  //     }
  //     return res
  //       .status(500)
  //       .json({ message: "Something went wrong. Please try again later." });
  //   }
});

const isLandlord = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const landlord = await User.findOne({ email });
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

const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const adminUser = await User.findOne({ email });
  if (!adminUser) {
    return res.status(404).json({
      message:
        "We couldn't find an account associated with this email address. Please double-check your email address and try again.",
    });
  }

  if (adminUser.role !== "admin") {
    return res.status(403).json({ message: "Not authorized." });
  }

  next();
});

module.exports = { isAdmin, authMiddleware, isLandlord };

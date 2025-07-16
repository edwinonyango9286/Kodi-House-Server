const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { refreshUserAccessToken } = require("../controllers/authController");

// access new access token should only be generated if the there is an access token
const verifyUserToken = expressAsyncHandler(async (req, res, next) => {
  const authorizationHeader = req?.headers?.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    return res.status(401).json({ status: "FAILED", message: "Authorization header missing. Please log in to continue." });
  }
  const accessToken = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) { return res.status(401).json({ status: "FAILED", message: "Invalid access token. Please log in to continue." }) }
    req.user = user;
    next();
  } catch (error) {
    if ( error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      try {
        const newAccessToken = await refreshUserAccessToken(req, res);
        req.headers.authorization = `Bearer ${newAccessToken}`;
        next();
      } catch (err) {
        return res.status(403).json({ status: "FAILED", message: "Failed to refresh access token. Please log in to continue." });
      }
    } else {
      next(error);
    }
  }
});

const checkUserRole = (roles) => {
  return expressAsyncHandler(async (req, res, next) => {
    const { email } = req.user;
    const user = await User.findOne({ email }).populate("role");
    console.log(user, "=>userMakingRequest")
    if (!user) {
      return res.status(404).json({ status: "FAILED", message: "We couldn't find an account associated with this email address. Please double-check your email address and try again." });
    }
    const userRole = user.role.name;
    const hasRole = roles.includes(userRole);
    if (!hasRole) {
      return res.status(403).json({ status: "FAILED", message: "Not authorized." });
    }
    next();
  });
};

const checkUserPermission = (permission) => {
  return expressAsyncHandler(async (req, res, next) => {
    console.log(permission,"=>permission")
    const { email } = req.user;
    const user = await User.findOne({ email }).populate({ path: "role",populate: {path: "permissions",model: "Permission",},});
    if (!user) {
      return res.status(404).json({ status: "FAILED", message:"We couldn't find an account associated with this email address. Please double-check your email address and try again.",});
    }
    const userPermissions = user.role.permissions.map((permission) => permission.permissionName);
    console.log(userPermissions,"userPermissions")
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({status: "FAILED",message: "Not authorized.",});
    }
    next();
  });
};




module.exports = {verifyUserToken,checkUserRole,checkUserPermission};

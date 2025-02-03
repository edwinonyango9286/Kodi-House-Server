const asyncHandler = require("express-async-handler");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const Tenant = require("../models/tenantsModel");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMails");
const ejs = require("ejs");
const path = require("path");

const registerNewTenant = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
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

    //check is the tenant already exist in the database using tenant email
    const tenant = await Tenant.findOne({ email });
    if (tenant) {
      res.status(409).json({
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }

    const newTenant = {
      name,
      email,
      password,
    };

    const activationToken = createActivationToken(newTenant);
    const activationCode = activationToken.activationCode;
    const data = { newTenant: { name: newTenant?.name }, activationCode };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mail-templates/tenant-activation-mail.ejs"),
      data
    );

    await sendMail({
      email: newTenant?.email,
      subject: "Account Activation",
      template: "tenant-activation-mail.ejs",
      data,
    });
    return res.status(200).json({
      success: true,
      message: `An account activation code has been sent to ${newTenant?.email}. Please check it.`,
      activationToken: activationToken?.token,
    });
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });  }
});

//create tenant activation token

const createActivationToken = (tenant) => {
  try {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
      {
        tenant,
        activationCode,
      },
      process.env.ACTIVATION_SECRET,
      {
        expiresIn: "5min",
      }
    );
    return { token, activationCode };
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });  }
};

const activateTenantAccount = asyncHandler(async (req, res) => {
  try {
    const { activationToken, activationCode } = req.body;
    if (!activationToken || !activationCode) {
      return res.status(400).json({
        message: "Please provide all the required fields.",
      });
    }

    let newTenant;
    try {
      newTenant = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ message: "Activation token has expired." });
      }
      return res.status(400).json({ message: "Invalid activation token." });
    }

    if (newTenant.activationCode !== activationCode) {
      return res.status(400).json({ message: "Invalid activation code." });
    }
    const { name, email, password } = newTenant.tenant;
    const existingTenant = await Tenant.findOne({ email });

    if (existingTenant) {
      return res.status(409).json({
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }
    const tenant = await Tenant.create({
      name,
      email,
      password,
      role: "tenant",
    });
    return res.status(201).json({
      success: true,
      message:
        "Your account has been successfully activated. Please proceed to log in.",
    });
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });  }
});

const loginTenant = asyncHandler(async (req, res) => {
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
  tenant.tokenVersion += 1;
  await tenant.save();
  const accessToken = generateAccessToken(tenant._id, tenant.tokenVersion);
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

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }
  const refreshToken = cookie.refreshToken;
  const tenant = await Tenant.findOne({ refreshToken });
  if (!tenant) {
    return res
      .status(401)
      .json({ message: "You're not logged in. Please log in to continue." });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (tenant.id !== decoded.id) {
      return res
        .status(403)
        .json({ message: "You're not logged in. Please log in to continue." });
    }
    const newAccessToken = generateAccessToken(tenant._id);
    req.tenant = tenant;
    return newAccessToken;
  } catch (error) {
    return res.status(403).json({
      message: "You're not logged in. Please log in to continue.",
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
    const html = await ejs.renderFile(
      path.join(
        __dirname,
        "../mail-templates/tenant-reset-password-token-mail.ejs"
      ),
      data
    );
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
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.refreshToken) {
      return res
        .status(401)
        .json({ message: "We could not find refresh token in cookies." });
    }
    const refreshToken = cookie.refreshToken;
    const tenant = await Tenant.findOne({ refreshToken });
    if (!tenant) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res
        .status(200)
        .json({ message: "You have successfully logged out." });
    }
    await Tenant.findOneAndUpdate(
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
    return res
      .status(200)
      .json({ message: "You have successfully logged out." });
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });  }
});


module.exports = {
  registerNewTenant,
  activateTenantAccount,
  loginTenant,
  handleRefreshToken,
  passwordResetToken,
  logout,
};

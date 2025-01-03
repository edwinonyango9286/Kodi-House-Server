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
    throw new Error(error);
  }
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
    throw new Error(error);
  }
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
    throw new Error(error);
  }
});

module.exports = {
  registerNewTenant,
  activateTenantAccount,
};

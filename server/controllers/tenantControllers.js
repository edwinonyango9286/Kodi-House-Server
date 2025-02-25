const expressAsyncHandler = require("express-async-handler");
const Tenant = require("../models/tenantModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const crypto = require("crypto");
const ejs = require("ejs");
const path = require("path");
const sendMail = require("../utils/sendMails");
const Property = require("../models/propertyModel")

// generate a random password for the tenant
const generateRandomPassword = (length = 8) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

// add a tenant
const addTenant = expressAsyncHandler(async (req, res) => {
  try {
    const { firstName, secondName, email, phoneNumber } = req.body;
    if (!firstName || !secondName || !email || !phoneNumber) {
      logger.error("Please provide all the required fields.");
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fileds.",
      });
    }

    // check for existing tenant
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      logger.error("email already exist.");
      return res.status(400).json({
        status: "FAILED",
        message:
          "An account with this email address already exists. Please use a different email address or log in to your existing account.",
      });
    }

    // generate a random password for the tenant
    const password = generateRandomPassword(8);
    const addedTenant = await Tenant.create({
      ...req.body,
      landlord: req.landlord._id,
      password: password,
    });

    // send the signin credentials to the tenant
    if (addedTenant) {
      const tenantData = {
        addedTenant: { firstName, email, password },
      };
      const data = {
        email: addedTenant?.email,
        subject: "Tenant Sign In Credentials.",
        template: "tenantSignInCredentials.ejs",
        data: tenantData,
      };
      await sendMail(data);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant added successfully.",
      data: addedTenant,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});











module.exports = { addTenant };

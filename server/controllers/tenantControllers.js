const expressAsyncHandler = require("express-async-handler");
const Tenant = require("../models/tenantModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const crypto = require("crypto");
const ejs = require("ejs");
const path = require("path");
const sendMail = require("../utils/sendMails");
const Property = require("../models/propertyModel");

// generate a random password for the tenant
const generateRandomPassword = (length = 8) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

// add a tenant=>a tenant is added by a landlord
const addTenant = expressAsyncHandler(async (req, res) => {
  try {
    const { firstName, secondName, email, phoneNumber } = req.body;
    // Validate required fields
    if (!firstName || !secondName || !email || !phoneNumber) {
      logger.error("Please provide all the required fields.");
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }

    // Check for existing tenant
    const existingTenant = await Tenant.findOne({ email });

    // If a tenant exists and the account is marked as deleted
    if (existingTenant) {
      if (existingTenant.isDeleted) {
        // Reactivate the existing tenant account
        existingTenant.firstName = firstName;
        existingTenant.secondName = secondName;
        existingTenant.phoneNumber = phoneNumber;
        existingTenant.password = generateRandomPassword(8);
        existingTenant.isDeleted = false; // Reactivate account
        existingTenant.accountStatus = "Active"; // Set account status to active
        await existingTenant.save();

        // send email to the reactivated tenant informing them that their account has been reactivated successfully
        const existingTenantData = {
          existingTenant: { firstName, email, password },
        };

        const data = {
          email: addedTenant.email,
          subject: "Tenant Sign In Credentials.",
          template: "tenantSignInCredentials.ejs",
          data: existingTenantData,
        };

        await sendMail(data);

        return res.status(200).json({
          status: "SUCCESS",
          message: "Tenant account reactivated successfully.",
          data: existingTenant,
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
    const addedTenant = await Tenant.create({
      ...req.body,
      landlord: req.landlord._id,
      password: generateRandomPassword(8),
    });

    // Send the sign-in credentials to the tenant
    if (addedTenant) {
      const tenantData = {
        addedTenant: { firstName, email, password },
      };
      const data = {
        email: addedTenant.email,
        subject: "Tenant Sign In Credentials.",
        template: "tenantSignInCredentials.ejs",
        data: tenantData,
      };
      await sendMail(data);
    }

    return res.status(201).json({
      status: "SUCCESS",
      message: "Tenant added successfully.",
      data: addedTenant,
    });
  } catch (error) {
    logger.error("Error adding tenant:", error);
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// general update for a tenant by landlord
const updateATenant = expressAsyncHandler(async (req, res) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const updatedTenant = await Tenant.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
      },
      req.body,
      {
        new: true,
      }
    );

    if (!updatedTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }

    return res
      .status(200)
      .json({ status: "SUCCESS", message: "Tenant Updated successfully." });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// landlord disable Tenant account
const disableTenantAccount = expressAsyncHandler(async () => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    // disbale tenant=> update tenant status to disabled
    const disabledTenant = await Tenant.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.body._id,
      },
      {
        accountStatus: "Disabled",
      },
      { new: true }
    );

    if (!disabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account disbaled successfully.",
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get all tenants related to a particular landlord=> retrieves only tenants whose account are not deleted
const getAllTenants = expressAsyncHandler(async () => {
  try {
    const tenants = await Tenant.find({
      isDeleted: false,
      landlord: req.landlord._id,
    });
    return res.status(200).json({ status: "SUCCESS", data: tenants });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get all tenants whose accounts are deleted  => by landlord
const getAllDeletedTenants = expressAsyncHandler(async () => {
  try {
    const deletedTenants = await Tenant.find({
      landlord: req.landlord._id,
      isDeleted: true,
      accountStatus: "Diasbled",
    });

    return res.status(200).json({ status: "SUCCESS", data: deletedTenants });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

const deleteATenant = expressAsyncHandler(async () => {
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
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  addTenant,
  updateATenant,
  deleteATenant,
  getAllDeletedTenants,
  getAllTenants,
  disableTenantAccount,
};

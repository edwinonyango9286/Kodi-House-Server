const expressAsyncHandler = require("express-async-handler");
const Tenant = require("../models/tenantModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const crypto = require("crypto");
const sendMail = require("../utils/sendMails");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");
const validatePassword = require("../utils/validatePassword");

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

const addATenant = expressAsyncHandler(async (req, res, next) => {
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

// general update for a tenant by landlord => only update a tenant whose account is not deleted
const updateATenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const updatedTenant = await Tenant.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
        isDeleted: false,
        deletedAt: null,
      },
      {
        ...req.body,
        // change the first letters of the names to uppercase
        firstName: _.startCase(_.toLower(firstName)),
        secondName: _.startCase(_.toLower(secondName)),
      },
      {
        new: true,
        runValidators: true,
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
    next(error);
  }
});

// landlord disable Tenant account
const disableTenantAccount = expressAsyncHandler(async (req, res, next) => {
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
    next(error);
  }
});

// get all tenants related to a particular landlord=>gets all tenants whose account are not deleted
const getAllTenants = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields"];
    excludeFields.forEach((element) => delete queryObject[element]);

    let queryString = JSON.stringify(queryObject);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // get only tenants who are not deleted and who are related to a particular logged in landlord
    let query = Tenant.find({
      ...JSON.parse(queryString),
      isDeleted: false,
      deletedAt: null,
      landlord: req.landlord._id,
    })
      .populate("landlord")
      // a tenant can have more than one property assigned to them
      .populate("properties")
      //  a tenant can have more that one unit assigned to them
      .populate("units");

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = req.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }
    // pagination
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    query = query.skip(offset).limit(limit);

    const tenants = await query;
    return res.status(200).json({ status: "SUCCESS", data: tenants });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// get all tenants whose accounts are deleted  => by landlord
const getAllDeletedTenants = expressAsyncHandler(async (req, res, next) => {
  try {
    const deletedTenants = await Tenant.find({
      landlord: req.landlord._id,
      isDeleted: true,
      accountStatus: "Diasbled",
    });

    return res.status(200).json({ status: "SUCCESS", data: deletedTenants });
  } catch (error) {
    next(error);
  }
});

const deleteATenant = expressAsyncHandler(async (req, res) => {
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
  updateATenant,
  deleteATenant,
  getAllDeletedTenants,
  getAllTenants,
  disableTenantAccount,
};

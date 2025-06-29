const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const { generateUserPassword } = require("../utils/generateUserPassword");
const sendMail = require("../utils/sendMails");



const createATenant = expressAsyncHandler(async(req,res,next)=>{
  try {
    const {firstName,secondName,email,phoneNumber}  = req.body
    if(!firstName || !secondName || !email || !phoneNumber){
      return res.status(400).json({ status:'FAILED', message:"Please provide all the required fields."})
    }

    const existingTenant = await User.findOne({ email });
    if(existingTenant){
      return res.status(409).json({ status:"FAILED", message:`Tenant with email ${existingTenant.email} already exist.` })
    }

     const userPassword = generateUserPassword();
    
    const createdTenant  = await User.create({ ...req.body, createdBy:req.user.id, password:userPassword, firstName:_.startCase(firstName), secondName:_.startCase(secondName) });
    const data = { user:{ userName: `${firstName} ${secondName}`, email:createdTenant.email}, password:userPassword}
    await sendMail({ email: createdTenant.email, subject: "Tenant account creation", template: "user-account-creation.ejs", data,});

    if(createdTenant){
      return res.status(201).json({ status:"SUCCESS", message:"Tenant created successfully. Tenant password has been sent to the registered email address.", data:createdTenant})
    }

  } catch (error) {
    logger.error(error)
    next(error)
  }
})


// general update for a tenant by landlord => only update a tenant whose account is not deleted
const updateTenantDetailsLandlord = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      validateMongoDbId(tenantId);
      const { firstName, secondName, email, phoneNumber } = req.body;
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
      const updatedTenant = await User.findOneAndUpdate(
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
        return res.status(404).json({
          status: "FAILED",
          message: "Tenant not found.",
        });
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Tenant Updated successfully.",
        data: updatedTenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// update tenant =>tenant
const updateTenantDetailsTenant = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      validateMongoDbId(tenantId);
      const { firstName, secondName, email, phoneNumber } = req.body;
      if (!firstName || !secondName || !email || !phoneNumber) {
        return res.status(400).json({
          status: "FAILED",
          message: "Please provide all required fileds.",
        });
      }
      validatePhoneNumber(phoneNumber);
      if (!emailValidator.validate(email)) {
        return res.status(400).json({
          status: "FAILED",
          message: "Please provide a valid email address.",
        });
      }
      const updatedTenant = await Tenant.findOneAndUpdate(
        {
          _id: tenantId,
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
      return res.status(200).json({
        status: "SUCCESS",
        message: "Tenant Updated successfully.",
        data: updatedTenant,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);

// landlord disable Tenant account
const disableTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    // disbale tenant=> update tenant status to disabled
    const disabledTenant = await User.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
      },
      {
        accountStatus: "Disabled",
      },
      { new: true, runValidators: true }
    );
    if (!disabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account disbaled successfully.",
      data: disabledTenant,
    });
  } catch (error) {
    next(error);
  }
});

const activateTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const enabledTenant = await User.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
      },
      { accountStatus: "Active" },
      { new: true, runValidators: true }
    );

    if (!enabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account enabled successfully.",
      data: enabledTenant,
    });
  } catch (error) {
    next(error);
  }
});

//Delete a tenant => landlord
const deleteTenantLandlord = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const deletedTenant = await User.findOneAndUpdate(
      { landlord: req.landlord._id, _id: tenantId },
      {
        isDeleted: true,
        deletedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
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

// Tenant deletes own account => Tenant
const deleteTenantTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const deletedTenant = await User.findOneAndUpdate( { _id:tenantId }, { createdBy:req.user._id, isDeleted: true, deletedAt: Date.now() } , { new: true, runValidators: true });
    if (!deletedTenant) {
      return res.status(400).json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({ status: "SUCCESS", message: "Tenant deleted successfully.", data: deletedTenant });
  } catch (error) {
    next(error);
  }
});

module.exports = { createATenant, updateTenantDetailsLandlord , disableTenant, activateTenant, updateTenantDetailsTenant, deleteTenantLandlord, deleteTenantTenant };

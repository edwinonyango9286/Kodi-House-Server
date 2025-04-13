const asyncHandler = require("express-async-handler");
const Application = require("../models/applicationModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const logger = require("../utils/logger");
const _ = require("lodash")

// create an application => after a user has viwed a house and the user is interested in that house the user sends and application to the tenant to book a viewing date
const createApplication = asyncHandler(async (req, res) => {
  const {firstName,lastName,email,phoneNumber,property,unit,tourDate,tourTime} = req.body;
  if (!firstName ||!lastName ||!email ||!phoneNumber ||!property ||!unit ||!tourDate ||!tourTime) {
    return res.status(400).json({status: "FAILED",message: "Please provide all the required fields",});
  }
  validatePhoneNumber(phoneNumber);
  if (!emailValidator.validate(email)) {
    return res.status(400).json({status: "FAILED",message: "Please provide a valid email address."});
  }
  try {
    const application = await Application.create({...req.body, firstName:_.startCase(firstName), lastName:_.startCase(lastName) });
    if (application) {
      return res.status(201).json({status: "SUCCESS",message: "Application created successfully", data: application});
    }
  } catch (error) {
    return res.status(500).json({status: "FAILED",message: error.message});
  }
});


// get application by id
const getApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  try {
    const application = await Application.findOne({ _id:applicationId, isDeleted:false });
    if (!application) {
      return res.status(404).json({ status: "FAILED", message: "Application not found." });
    }
    if(application){
      return res.status(200).json({ status: "SUCCESS", application });
    }
  } catch (error) {
    return res.status(500).json({status: "FAILED",message: error.message});
  }
});

// get all applications related to a particular landlord
const getAllApplications = asyncHandler(async (req, res) => {
  const { _id } = req.landlord;
  validateMongoDbId(_id);
  try {
    const applications = await Application.find({ landlord: _id });
    return res.status(200).json({ status: "SUCCESS", applications });
  } catch (error) {
    return res.status(500).json({status: "FAILED",message: error.message,});
  }
});

// update application by id
const updateApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  try {
    const {firstName,lastName,email,phoneNumber,property,unit,tourDate,tourTime} = req.body;
    if (!firstName ||!lastName ||!email ||!phoneNumber ||!property ||!unit ||!tourDate ||!tourTime) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields",});
    }
    const updatedApplication = Application.findOneAndUpdate({  _id:applicationId , isDeleted:false }, {...req.body, updatedBy:req.user._id} ,{ new:true , runValidators:true});
    if (!updatedApplication) {
      return res.status(404).json({ status: "FAILED", message: "Application not found." })
    }

    if (updatedApplication) {
      return res.status(200).json({status: "SUCCESS",message: "Application updated successfully.", data:updatedApplication});
    }
  } catch (error) {
    return res.status(500).json({status: "FAILED",message: error.message});
  }
});

// delete application by id
const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(id);
  try {
    const deletedApplication = Application.findOneAndUpdate({ _id: applicationId, isDeleted:false}, { isDeleted:true,deletedAt:Date.now() , deletedBy:req.user._id} , {new:true, runValidators:true});
    
    if (!deletedApplication) {
      return res.status(404).json({ status: "FAILED", message: "Application not found." });
    }
    if(deletedApplication){
    return res.status(200).json({status: "SUCCESS",message: "Application deleted successfully.", data:deletedApplication,});
    }
  } catch (error) {
    logger.error(error.message)
    return res.status(500).json({status: "FAILED",message: error.message});
  }
});

module.exports = {
  createApplication,
  getApplication,
  getAllApplications,
  updateApplication,
  deleteApplication,
};

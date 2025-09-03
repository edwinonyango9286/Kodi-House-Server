const asyncHandler = require("express-async-handler");
const Application = require("../models/applicationModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");

// create an application
const createApplication = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phoneNumber, property, unit, tourDate, tourTime } = req.body;
  if (!firstName || !lastName || !email || !phoneNumber || !property || !unit || !tourDate || !tourTime) {
    return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields" });
  };
  validatePhoneNumber(phoneNumber);
  if (!emailValidator.validate(email)) {
    return res.status(400).json({ status: "FAILED", message: "Please provide a valid email address." });
  }
  const application = await Application.create({...req.body, firstName: _.startCase(firstName),lastName: _.startCase(lastName)});
  return res.status(201).json({ status: "SUCCESS", message: "Application created successfully", data: application });
});

// get application by id
const getApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  const application = await Application.findOne({ _id: applicationId, isDeleted: false });
  if (!application) {
    return res.status(404).json({ status: "FAILED", message: "Application not found." });
  }
  return res.status(200).json({ status: "SUCCESS", application });
});

// get all applications related to a particular landlord
const getAllApplications = asyncHandler(async (req, res) => {
  const { _id } = req.landlord;
  validateMongoDbId(_id);
  const applications = await Application.find({ landlord: _id });
  return res.status(200).json({ status: "SUCCESS", applications });
});

// update application by id
const updateApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  const { firstName, lastName, email, phoneNumber, property, unit, tourDate, tourTime } = req.body;
  if (!firstName || !lastName || !email || !phoneNumber || !property || !unit || !tourDate || !tourTime) {
    return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields" });
  }
  const updatedApplication = await Application.findOneAndUpdate(
    { _id: applicationId, isDeleted: false },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!updatedApplication) {
    return res.status(404).json({ status: "FAILED", message: "Application not found." });
  }
  return res.status(200).json({ status: "SUCCESS", message: "Application updated successfully.", data: updatedApplication });
});

// delete application by id
const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  const deletedApplication = await Application.findOneAndUpdate(
    { _id: applicationId, isDeleted: false },
    { isDeleted: true, deletedAt: Date.now(), deletedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!deletedApplication) {
    return res.status(404).json({ status: "FAILED", message: "Application not found." });
  }
  return res.status(200).json({ status: "SUCCESS", message: "Application deleted successfully.", data: deletedApplication });
});

module.exports = { createApplication, getApplication,getAllApplications,updateApplication, deleteApplication };
const asyncHandler = require("express-async-handler");
const Application = require("../models/applicationModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");

// create an application => after a user has viwed a house and the user is interested in that house the user sends and application to the tenant to book a viewing date
const createApplication = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    property,
    unit,
    tourDate,
    tourTime,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phoneNumber ||
    !property ||
    !unit ||
    !tourDate ||
    !tourTime
  ) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide all the required fields",
    });
  }
  validatePhoneNumber(phoneNumber);
  if (!emailValidator.validate(email)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide a valid email address.",
    });
  }
  try {
    const application = await Application.create(req.body);
    if (application) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "Application created successfully",
        application,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// get application by id
const getApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const application = Application.findById({ id });
    if (!application) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Application not found." });
    }
    return res.status(200).json({ status: "SUCCESS", application });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
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
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// update application by id
const updateApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  validateMongoDbId(applicationId);
  try {
    const updatedApplication = Application.findByIdAndUpdate({ applicationId });
    if (updatedApplication) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Application updated successfully.",
        updatedApplication,
      });
    }
    if (!updatedApplication) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Application not found." });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// delete application by id
const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedApplication = Application.findByIdAndDelete(id);
    if (deletedApplication) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Application deleted successfully.",
        deletedApplication,
      });
    }
    if (!deletedApplication) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Application not found." });
    }
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

module.exports = {
  createApplication,
  getApplication,
  getAllApplications,
  updateApplication,
  deleteApplication,
};

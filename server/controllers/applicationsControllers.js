const asyncHandler = require("express-async-handler");
import Application from "../models/applocationsModel";
import validateMongoDbId from "../utils/validateMongoDbId";

// create an application

const createApplication = asyncHandler(async (req, res) => {
  const { unitName, userName } = req.body;
  if (!unitName || !userName) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide all the required fields",
    });
  }
  try {
    const application = await Application.create(req.body);
    if (application) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "Application created successfully.",
      });
    }
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

// get application by id
const getApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ message: "Please provide an application Id" });
  }
  validateMongoDbId(id);
  try {
    const application = Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }
    if (application) {
      return res.status(200).json({ application, success: true });
    }
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

// get all applications

const getAllApplications = asyncHandler(async (req, res) => {
  try {
    const applications = Application.find();
    if (applications) {
      return res.status(200).json({ success: true, applications });
    }
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

// update application by id
const updateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ message: "Please provide an application Id" });
  }
  validateMongoDbId(id);

  try {
    const application = Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }
    const updatedApplication = Application.findByIdAndUpdate(id);
    if (updatedApplication) {
      return res
        .status(200)
        .json({ success: true, message: "Application updated successfully." });
    }
  } catch (error) {
    return res
    .status(500)
    .json({
      status: "FAILED",
      message: "The application has experienced an error. Please try again.",
    });
  }
});

// delete application by id
const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ message: "Please provide an application id." });
  }
  validateMongoDbId(id);

  try {
    const application = Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }
    const deletedApplication = Application.findByIdAndDelete(id);
    if (deletedApplication) {
      return res
        .status(200)
        .json({ success: true, message: "Application deleted successfully." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        status: "FAILED",
        message: "The application has experienced an error. Please try again.",
      });
  }
});



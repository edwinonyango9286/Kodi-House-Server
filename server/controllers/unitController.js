const Unit = require("../models/unitModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

// add a new unit
const addANewUnit = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      property,
      category,
      rentPerMonth,
      unitNumber,
      tag,
      description,
      videos,
      images,
    } = req.body;

    if (
      !property ||
      !category ||
      !rentPerMonth ||
      !unitNumber ||
      !tag ||
      !description ||
      !images
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // check if a unit with the same unit number already exist
    const unit = await Unit.findOne({ unitNumber });
    if (unit) {
      return res.status(400).json({
        status: "FAILED",
        message: "A unit with the same unit number already exist.",
      });
    }
    const newUnit = await Unit.create({ ...req.body, landlord: _id });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Unit added successfully.",
      newUnit,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// adding multiple units from an excel sheet
const uploads = multer({ dest: "uploads/" });
const addMultipleUnitsFromExcelSheet = expressAsyncHandler(async (req, res) => {
  try {
    let uploadedFilePath = req.file.path;
    const workBook = xlsx.readFile(uploadedFilePath);
    const sheetName = workBook.SheetNames[0];
    const sheet = workBook.Sheets[sheetName];
    // converts the sheet to json
    let units = xlsx.utils.sheet_to_json(sheet);
    // Insert the units into the database
    units = await Unit.insertMany(units);
    // delete  uploaded excel file from the uploads directory when upload is successfull.
    if (units) {
      fs.unlink(uploadedFilePath, (err) => {
        if (err) {
          console.error("Error deleting the file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    }
    return res
      .status(201)
      .json({ status: "SUCCESS", message: "Units added successfully." });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

const updateAUnit = expressAsyncHandler(async (req, res) => {
  const { _id } = req.landlord;
  const { unitId } = req.params;
  validateMongoDbId(_id);
  validateMongoDbId(unitId);
  try {
    const updatedUnit = await Unit.findOneAndUpdate(
      { _id: unitId, landlord: _id },
      { new: true }
    );
    if (!updatedUnit) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Unit not found." });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get all units
const getAllUnits = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const units = await Unit.find({ landlord: _id });
    return res.status(200).json({ status: "SUCCESS", units });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// delete a unit
const deleteAUnit = expressAsyncHandler(async (req, res) => {
  try {
  } catch (error) {}
});

const searchUnits = expressAsyncHandler(async (req, res) => {

});




module.exports = {
  getAllUnits,
  addANewUnit,
  updateAUnit,
  uploads,
  addMultipleUnitsFromExcelSheet,
};

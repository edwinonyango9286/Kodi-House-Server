const Unit = require("../models/unitModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

// add a new unit
const addANewUnit = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      property,
      category,
      rentPerMonth,
      tags,
      shortDescription,
      images,
      unitNumber,
    } = req.body;

    if (
      !property ||
      !category ||
      !rentPerMonth ||
      !tags ||
      !shortDescription ||
      !images ||
      !unitNumber
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }

    // Check if a unit with the same unit number already exists
    const existingUnit = await Unit.findOne({ landlord: _id, unitNumber });

    if (existingUnit) {
      // If the unit exists and isDeleted is true, restore it
      if (existingUnit.isDeleted) {
        existingUnit.isDeleted = false;
        existingUnit.deletedAt = null;
        await existingUnit.save();
        return res.status(200).json({
          status: "SUCCESS",
          message: "Unit created successfully.",
          data: existingUnit,
        });
      } else {
        // If the unit exists and is not deleted, return an error
        return res.status(400).json({
          status: "FAILED",
          message: "A unit with the same unit number already exists.",
        });
      }
    }
    // If no existing unit, create a new one
    const newUnit = await Unit.create({ ...req.body, landlord: _id });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Unit added successfully.",
      data: newUnit,
    });
  } catch (error) {
    next(error);
  }
});

// adding multiple units from an excel sheet
const uploads = multer({ dest: "uploads/" });

const addMultipleUnitsFromExcelSheet = expressAsyncHandler(
  async (req, res, next) => {
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
            console.log("File deleted successfully.");
          }
        });
      }
      return res
        .status(201)
        .json({ status: "SUCCESS", message: "Units added successfully." });
    } catch (error) {
      next(error);
    }
  }
);

// update a unit => only update a unit that is not deleted
const updateAUnit = expressAsyncHandler(async (req, res, next) => {
  const { _id } = req.landlord;
  const { unitId } = req.params;
  validateMongoDbId(_id);
  validateMongoDbId(unitId);
  try {
    // only update a unit which is not deleted
    const updatedUnit = await Unit.findOneAndUpdate(
      { _id: unitId, landlord: _id, isDeleted: false, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUnit) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Unit not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Unit updated successfully.",
      data: updatedUnit,
    });
  } catch (error) {
    next(error);
  }
});

// get all units=> all units that are not deleted
const getAllUnits = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    // exclude fileds for paginantion and sorting
    const excludedFields = ["page", "sort", "limit", "offset", "fields"];
    excludedFields.forEach((el) => delete queryObject[el]);
    queryObject.isDeleted = false;
    queryObject.deletedAt = null;

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Unit.find(JSON.parse(queryStr));

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
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

    const units = await query;

    return res.status(200).json({ status: "SUCCESS", data: units });
  } catch (error) {
    next(error);
  }
});

// delete a unit => update
const deleteAUnit = expressAsyncHandler(async (req, res, next) => {
  try {
    const { unitId } = req.params;
    validateMongoDbId(unitId);
    const deletedUnit = await Unit.findOneAndUpdate(
      {
        _id: unitId,
        landlord: req.landlord._id,
        isDeleted: false,
      },
      { isDeleted: true, deletedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!deletedUnit) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Unit not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Unit deleted successfully.",
      data: deletedUnit,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAllUnits,
  addANewUnit,
  updateAUnit,
  uploads,
  deleteAUnit,
  addMultipleUnitsFromExcelSheet,
};

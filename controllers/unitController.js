const Unit = require("../models/unitModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");

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
    const existingUnit = await Unit.findOne({
      landlord: _id,
      unitNumber: unitNumber.toUpperCase(),
    });

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
    const newUnit = await Unit.create({
      ...req.body,
      landlord: _id,
      unitNumber: unitNumber.toUpperCase(),
      shortDescription: descriptionFormater(shortDescription),
    });
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
  const { unitNumber, shortDescription } = req.body;

  try {
    // only update a unit which is not deleted
    const updatedUnit = await Unit.findOneAndUpdate(
      { _id: unitId, landlord: _id, isDeleted: false, deletedAt: null },
      {
        ...req.body,
        unitNumber: unitNumber.toUpperCase(),
        shortDescription: descriptionFormater(shortDescription),
      },
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

// get all units=> ruturns all units that are not deleted => this will work for both landlords and all other user including quest users in the website
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

    // check if the request is from a landlord then filter by landlord id
    if (req.landlord && req.landlord._id) {
      queryObject.landlord = req.landlord._id;
    }

    let query = Unit.find(JSON.parse(queryStr))
      .populate({
        path: "landlord",
        select: "userName",
      })
      .populate({ path: "property", select: "name" })
      .populate({ path: "category", select: "name" });

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

// delete a unit => in production deletion will be disabled
const deleteAUnit = expressAsyncHandler(async (req, res, next) => {
  try {
    const { unitId } = req.params;
    validateMongoDbId(unitId);

    // only get the unit if its  not deleted if the unit has already been deleted return  not found
    const deletedUnit = await Unit.findOneAndUpdate(
      {
        _id: unitId,
        landlord: req.landlord._id,
        isDeleted: false,
        deletedAt: null,
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

// script to add fields to already created documents

const addFields = expressAsyncHandler(async (req, res, next) => {
  try {
    const result = await Unit.updateMany(
      {
        currentOccupant: { $exist: false },
      },
      { $set: { currentOccupant: null } }
    );

    return res
      .status(200)
      .json({ status: "SUCCESS", message: "", data: result });
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
  addFields,
};

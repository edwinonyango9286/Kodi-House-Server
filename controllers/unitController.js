const Unit = require("../models/unitModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const logger = require("../utils/logger");
const Property = require("../models/propertyModel");
const User = require("../models/userModel")

// add a new unit
const addANewUnit = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    validateMongoDbId(_id);
    const { property, category, rent, tags, shortDescription, images, unitNumber } = req.body;
    if ( !property || !category || !rent || !tags || !shortDescription || !images || !unitNumber ) {
      return res.status(400).json({ status: "FAILED",  message: "Please provide all the required fields." });
    }
    // Check if a unit with the same unit number already exists
    const existingUnit = await Unit.findOne({ property:property, createdBy: _id, isDeleted:false,deletedAt:null, unitNumber: unitNumber.toUpperCase()});
    if(existingUnit){
      return res.status(409).json({ status:"FAILED", message:`Unit ${unitNumber} already exist.`})
    }
    // If no existing unit, create a new one
    const newUnit = await Unit.create({ ...req.body,createdBy: _id, unitNumber: unitNumber.toUpperCase(), shortDescription: descriptionFormater(shortDescription) });
    return res.status(201).json({ status: "SUCCESS", message: "Unit added successfully.", data: newUnit });
  } catch (error) {
    logger.error(error)
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
    const excludeFields = ["page", "sort", "limit", "offset", "fields","search"];
    excludeFields.forEach((el) => delete queryObject[el]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const userMakingRequest = await User.findOne({ _id:req?.user?._id}).populate("role","name");

    let query;
    let baseQuery = JSON.parse(queryStr);


    if(req.query.search){
      const searchRegex = new RegExp(req.query.search, "i");
      baseQuery.$or = [{unitNumber:searchRegex},{currentStatus:searchRegex},{category:searchRegex}]
    }
    if(userMakingRequest && userMakingRequest.role.name ==="Landlord"){
      query = Unit.find({...baseQuery, createdBy:req.user._id, isDeleted: false,deletedAt: null,}).populate({path: "createdBy",select: "userName",populate: { path: "role",select: "name"}}).populate("currentOccupant", "firstName secondName").populate("category");
    }else if(userMakingRequest && userMakingRequest.role.name === "Admin"){
      query = Unit.find({...baseQuery, isDeleted: false,deletedAt: null,}).populate({path: "createdBy",select: "userName",populate: { path: "role",select: "name"}}).populate("currentOccupant", "firstName secondName").populate("category");
    }else{
      query = Unit.find({...baseQuery, currentStatus:"Vacant", isDeleted: false,deletedAt: null,}).populate({path: "createdBy",select: "userName",populate: { path: "role",select: "name"}}).populate("currentOccupant", "firstName secondName").populate("category");
    }

    if (req.query.sort) query = query.sort(req.query.sort.split(",").join(" "));
    if (req.query.fields) query = query.select(req.query.fields.split(",").join(" "));
    
    const limit = parseInt(req.query.limit) || 10;
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    query = query.skip(offset).limit(limit);

    const units = await query;
    const totalCount = await Unit.countDocuments(query)
    const totalPages = Math.ceil(totalCount / limit);
    
   return res.status(200).json({status: "SUCCESS", message:"Units listed successfully.", data: units, totalCount, totalPages, limit, offset});
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

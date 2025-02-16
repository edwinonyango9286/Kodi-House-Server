const Property = require("../models/propertyModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");

// add a new property
const addAProperty = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      name,
      category,
      type,
      numberOfUnits,
      rentPerUnit,
      description,
      videos,
      googleMap,
      images,
      features,
      numberOfBedrooms,
      numberofBathrooms,
      location,
      currentStatus,
    } = req.body;

    if (
      !name ||
      !category ||
      !type ||
      !numberOfUnits ||
      !rentPerUnit ||
      !description ||
      !googleMap ||
      !images ||
      !location ||
      !currentStatus
    ) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // check for existing property by name
    const existingProperty = await Property.findOne({ name });
    if (existingProperty) {
      return res.status(400).json({
        status: "FAILED",
        message: "A property with a simillar name already exist.",
      });
    }
    const newProperty = await Property.create({ ...req.body, landlord: _id });
    return res.status(201).json({ status: "SUCCESS", newProperty });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// update a property
error;
const updateAproperty = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { propertyId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(propertyId);
    const updatedProperty = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        landlord: _id,
      },
      { new: true }
    );

    if (!updatedProperty) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Property not found." });
    }

    return res.status(200).json({ status: "SUCCESS", updatedProperty });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get a property by Id

const getApropertyById = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { propertyId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(propertyId);
    const property = await Property.findOne({ _id: propertyId, landlord: _id });
    if (!property) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Property not found." });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get all properties related to the landlord
const getAllProperties = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const properties = await Property.find({ landlord: _id });
    return res.status(200).json({ status: "SUCCESS", properties });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// delete a property
const deleteAProperty = expressAsyncHandler(async (req, res) => {});

module.exports = {
  addAProperty,
  getApropertyById,
  getAllProperties,
  updateAproperty,
  deleteAProperty,
};

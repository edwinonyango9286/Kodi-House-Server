const expressAsyncHandler = require("express-async-handler");
const PropertyCategory = require("../models/propertyCategoryModel");
const _ = require("lodash");

const addAPropertyCategory = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Please provide category name." });
    }
    // check if category name exist
    const propertyCategory = await PropertyCategory.findOne({
      landlord: req.landlord._id,
      name: _.startCase(_.toLower(name)),
    });
    // if property category exist but is deleted restore it
    if (propertyCategory) {
      if (propertyCategory.isDeleted) {
        propertyCategory.isDeleted = false;
        propertyCategory.deletedAt = null;
        await propertyCategory.save();
        return res.status(201).json({
          status: "SUCCESS",
          message: "Property category added successfully.",
        });
      } else {
        return res.status(409).json({
          status: "FAILED",
          message: "Property category with a simillar name already exist.",
        });
      }
    }
    // if property category does not exist create one
    const createdPropertyCategory = await PropertyCategory.create({
      landlord: req.landlord._id,
      ...req.body,
      name: _.startCase(_.toLower(name)),
    });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Property category created successfully.",
      data: createdPropertyCategory,
    });
  } catch (error) {
    next(error);
  }
});

const getAllPropertyCategories = expressAsyncHandler(async (req, res, next) => {
  try {
    const propertyCategories = await PropertyCategory.find({
      landlord: req.landlord._id,
      isDeleted: false,
    });
    return res
      .status(200)
      .json({ status: "SUCCESS", data: propertyCategories });
  } catch (error) {
    next(error);
  }
});

module.exports = { addAPropertyCategory, getAllPropertyCategories };

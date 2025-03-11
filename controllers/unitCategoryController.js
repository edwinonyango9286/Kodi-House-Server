const expressAsyncHandler = require("express-async-handler");
const UnitCategory = require("../models/unitCategoryModel");
const _ = require("lodash");

const addAUnitCategory = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide unit category name.",
      });
    }
    // check if the unit category name already exist
    const existingUnitCategory = await UnitCategory.findOne({
      landlord: req.landlord._id,
      name: _.startCase(_.toLower(name)),
    });
    if (existingUnitCategory) {
      if (existingUnitCategory.isDeleted) {
        existingUnitCategory.isDeleted = false;
        existingUnitCategory.deletedAt = null;
        await existingUnitCategory.save();

        return res.status(201).json({
          status: "FAILED",
          message: "Unit category created successfully.",
          data: existingUnitCategory,
        });
      } else {
        return res.status(409).json({
          status: "FAILED",
          message: "Unit category with a simillar name already exist.",
        });
      }
    }
    const createdUnitCategory = await UnitCategory.create({
      landlord: req.landlord._id,
      name: _.startCase(_.toLower(name)),
    });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Unit category created successfully.",
      data: createdUnitCategory,
    });
  } catch (error) {
    next(error);
  }
});

const getAllUnitCategories = expressAsyncHandler(async (req, res, next) => {
  try {
    // returns only the unit categories that are not deleted
    const unitCategories = await UnitCategory.find({
      landlord: req.landlord._id,
      isDeleted: false,
    });
    return res.status(200).json({ status: "SUCCESS", data: unitCategories });
  } catch (error) {
    next(error);
  }
});

module.exports = { addAUnitCategory, getAllUnitCategories };

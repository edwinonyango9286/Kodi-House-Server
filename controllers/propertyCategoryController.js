const expressAsyncHandler = require("express-async-handler");
const PropertyCategory = require("../models/propertyCategoryModel");
const _ = require("lodash");
const { default: slugify } = require("slugify");

const addAPropertyCategory = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !description || !status ) { return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields." })}
    // check if category name exist
    const propertyCategory = await PropertyCategory.findOne({ isDeleted:false, deletedAt:null, name: _.startCase(_.toLower(name)),});
    // if property category exist but is deleted restore it
    if (propertyCategory) { return res.status(409).json({ status: "FAILED",message: `Property category ${propertyCategory.name} already exist.`})}
    // if property category does not exist create one
    const createdPropertyCategory = await PropertyCategory.create({ createdBy: req.user._id, ...req.body, name: _.startCase(_.toLower(name)), slug:slugify(name)});
    return res.status(201).json({ status: "SUCCESS", message: "Property category created successfully.",data: createdPropertyCategory });
  } catch (error) {
    next(error);
  }
});

const getAllPropertyCategories = expressAsyncHandler(async (req, res, next) => {
  try {
    const propertyCategories = await PropertyCategory.find({ isDeleted:false,deletedAt:null }).populate("createdBy", "userName");
    return res.status(200).json({ status: "SUCCESS", data: propertyCategories });
  } catch (error) {
    next(error);
  }
});





module.exports = { addAPropertyCategory, getAllPropertyCategories };

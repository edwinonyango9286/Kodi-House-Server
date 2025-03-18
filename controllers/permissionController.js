const expressAsyncHandler = require("express-async-handler");
const Permission = require("../models/permissionModel");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const logger = require("../utils/logger");
const slugify = require("slugify");

const createAPermission = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        status: "SUCCESS",
        message: "Please provide all the required fields.",
      });
    }

    // check if a permission with a similar name already exist
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(409).json({
        status: "FAILED",
        message: `${existingPermission.name} permission already exist.`,
      });
    }

    const createdPermission = await Permission.create({
      ...req.body,
      createdBy: req.user._id,
      description: descriptionFormater(description),
      slug: slugify(name),
    });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Permission created successfully.",
      data: createdPermission,
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = { createAPermission };

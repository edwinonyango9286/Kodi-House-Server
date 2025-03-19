const expressAsyncHandler = require("express-async-handler");
const Permission = require("../models/permissionModel");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const logger = require("../utils/logger");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongoDbId");
const Role = require("../models/roleModel");

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

const updateAPermission = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const { permissionId } = req.params;
    validateMongoDbId(permissionId);
    if (!name || !description || !status) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updatedPermission = await Permission.findOneAndUpdate(
      { _id: permissionId },
      {
        ...req.body,
        updatedBy: req.user._id,
        description: descriptionFormater(description),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPermission) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Permission not found." });
    }
    return res
      .status(200)
      .json({ status: "SUCCESS", message: "Permission updated successfully." });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

const getAllPermissions = expressAsyncHandler(async (req, res, next) => {
  try {
    const permissions = await Permission.find({
      isDeleted: false,
      deletedAt: null,
    });
    return res.status(200).json({ status: "SUCCESS", data: permissions });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

const getAPermission = expressAsyncHandler(async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    validateMongoDbId(permissionId);
    const permission = await Permission.findOne({
      _id: permissionId,
      isDeleted: false,
      deletedAt: null,
    });
    if (!permission) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Permission not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: permission });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

const deleteAPermission = expressAsyncHandler(async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    validateMongoDbId(permissionId);
    const deletedPermission = await Permission.findOneAndUpdate(
      {
        _id: permissionId,
        isDeleted: false,
        deletedAt: null,
      },
      { isDeleted: true, deletedAt: Date.now() },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!deletedPermission) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Permission not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Permission deleted successfully.",
      data: deletedPermission,
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});


const restoreADeletedPermission = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { permissionId } = req.params;
      validateMongoDbId(permissionId);
      const restoredPermission = await Permission.findOneAndUpdate(
        {
          _id: permissionId,
          isDeleted: true,
          deletedAt: { $ne: null },
        },
        { isDeleted: false, deletedAt: null },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!restoredPermission) {
        return res
          .status(404)
          .json({ status: "FAILED", message: "Permission not found." });
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Permission restored successfully.",
        data: restoredPermission,
      });
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

module.exports = {
  createAPermission,
  updateAPermission,
  getAPermission,
  getAllPermissions,
  deleteAPermission,
  restoreADeletedPermission,
};

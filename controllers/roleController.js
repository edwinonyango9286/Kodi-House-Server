const Role = require("../models/roleModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const logger = require("../utils/logger");
const slugify = require("slugify");

// Both admins and landlords can add roles
const createARole = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !description || !status) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // check if the role already exist by name
    const existingRole = await Role.findOne({
      name: _.startCase(_.toLower(name)),
    });
    // if the role already exist and isDeleted is true then update the role
    if (existingRole) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Role already exist." });
    }
    const createdRole = await Role.create({
      ...req.body,
      name: _.startCase(_.toLower(name)),
      description: descriptionFormater(description),
      slug: slugify(name),
      createdBy: req.user._id,
    });
    if (createdRole) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "Role created successfully.",
        data: createdRole,
      });
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

const grantPermissionToARole = expressAsyncHandler(async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    console.log(roleId)
    validateMongoDbId(roleId);

    if (!permissionId) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Please provide permission Id." });
    }
    validateMongoDbId(permissionId);

 
    const grantedRole = await Role.findOneAndUpdate(
      {
        _id: roleId,
      },
      {
        $addToSet: { permissions: permissionId },
      },
      { new: true, runValidators: true }
    );
    if (!grantedRole) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Role not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: `Permission granted to ${grantedRole.name} sucessfully.`,
      data: grantedRole,
    });
  } catch (error) {
    next(error);
  }
});

// All the admins and landlords can add roles
const getARole = expressAsyncHandler(async (req, res, next) => {
  try {
    const { roleId } = req.params;
    validateMongoDbId(roleId);
    // find a role related to that particular landlord => only get the role if it is not deleted
    const role = await Role.findOne({
      _id: roleId,
      isDeleted: false,
      deletedAt: null,
    })
      .populate({ path: "createdBy", select: "userName" })
      .populate({ path: "permissions", select: "name" });
    if (!role) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Role not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: role });
  } catch (error) {
    next(error);
  }
});

// update a role
const updateARole = expressAsyncHandler(async (req, res) => {
  try {
    const { roleId } = req.params;
    validateMongoDbId(roleId);
    const { name, description, status } = req.body;
    if (!name || !description || !status) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updatedRole = await Role.findOneAndUpdate(
      { _id: roleId },
      {
        ...req.body,
        name: _.startCase(_.toLower(name)),
        description: descriptionFormater(description),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRole) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Role not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Role update successfully.",
      updatedRole,
    });
  } catch (error) {
    logger.error();
    next(error);
  }
});

const getAllRoles = expressAsyncHandler(async (req, res, next) => {
  try {
    const roles = await Role.find({
      isDeleted: false,
      deletedAt: null,
    })
      .populate({ path: "createdBy", select: "userName" })
      .populate({ path: "permissions", select: "name" });
    return res.status(200).json({ status: "SUCCESS", data: roles });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

const deleteARole = expressAsyncHandler(async (req, res, next) => {
  try {
    const { roleId } = req.params;
    validateMongoDbId(roleId);
    // deleted the role if it havent been deleted
    const deletedRole = await Role.findOneAndUpdate(
      {
        _id: roleId,
        isDeleted: false,
        deletedAt: null,
      },
      { isDeleted: true, deletedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!deletedRole) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Role not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Role deleted successfully.",
      data: deletedRole,
    });
  } catch (error) {
    logger.error(error.message);
    next();
  }
});

module.exports = {
  createARole,
  updateARole,
  getAllRoles,
  getARole,
  deleteARole,
  grantPermissionToARole,
};

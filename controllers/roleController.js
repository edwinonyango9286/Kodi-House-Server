const Role = require("../models/roleModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");

const addARole = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    let role = await Role.findOne({ landlord: _id, name: _.capitalize(name) });
    // if the role already exist and isDeleted is true then update the role
    if (role) {
      if (role.isDeleted) {
        (role.isDeleted = false), (role.deletedAt = null), await role.save();
        return res.status(200).json({
          status: "SUCCESS",
          message: "Role created successfully.",
          data: role,
        });
      } else {
        return res
          .status(400)
          .json({ status: "FAILED", message: "Role already exist." });
      }
    }

    const createdRole = await Role.create({
      ...req.body,
      name: _.capitalize(name),
      landlord: _id,
    });
    if (createdRole) {
      return res.status(201).json({
        status: "SUCCESS",
        message: "Role created successfully.",
        data: createdRole,
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get a single role => by landlord if the role is not deleted
const getARole = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { roleId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(roleId);
    // find a role related to that particular landlord => only get the role if it is not deleted
    const role = await Role.findOne({
      _id: roleId,
      landlord: _id,
      isDeleted: false,
      deletedAt: null,
    });
    if (!role) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Role not found." });
    }
    return res.status(200).json({ status: "SUCCESS", role });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// update a role
const updateARole = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { roleId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(roleId);

    console.log(_id, roleId);
    const { name } = req.body;
    if (!name) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updatedRole = await Role.findOneAndUpdate(
      { _id: roleId, landlord: _id },
      { ...req.body, name: _.capitalize(name) },
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
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

const getAllRoles = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const roles = await Role.find({
      landlord: _id,
      isDeleted: false,
      deletedAt: null,
    });
    return res.status(200).json({ status: "SUCCESS", data: roles });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

const deleteARole = expressAsyncHandler(async (req, res) => {
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
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  addARole,
  updateARole,
  getAllRoles,
  getARole,
  deleteARole,
};

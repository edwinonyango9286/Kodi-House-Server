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
    let role = await Role.findOne({ name: _.capitalize(name) });
    if (role) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Role already exist." });
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
        createdRole,
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get a single role => by landlord
const getARole = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { roleId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(roleId);
    // find a role related to that particular landlord
    const role = await Role.findOne({ _id: roleId, landlord: _id });
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
    const roles = await Role.find({ landlord: _id });
    return res.status(200).json({ status: "SUCCESS", roles });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// delete a role=> still thinking of how to handle deletion.
// casecading, soft deletion



module.exports = {
  addARole,
  updateARole,
  getAllRoles,
  getARole,
};

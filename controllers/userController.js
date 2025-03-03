const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const validateMongoDbId = require("../utils/validateMongoDbId");

// add a new user =>Done by landlord
const addAuser = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      firstName,
      secondName,
      email,
      phoneNumber,
      role,
      status,
      description,
      property,
    } = req.body;

    if (
      !firstName ||
      !secondName ||
      !email ||
      !phoneNumber ||
      !role ||
      !status ||
      !description ||
      !property
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }

    // check if user already exist by email
    const existingUser = User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message:
          "A user with this email already exist. Please double check your email address or use a different email.",
      });
    }
    const user = await User.create({ ...req.body, landlord: _id });

    return res.status(201).json({
      status: "SUCCESS",
      message: "User added successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// get a user by id => Done by landlord related to that user/was created by the landlord
const getAUserById = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { userId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(userId);

    const user = await User.findOne({ _id: userId, addedBy: _id });
    if (!user) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      user,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// get all users related to a particular landlord=>get all the user who are not deleted
const getAllUsers = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find({
      landlord: req.landlord._id,
      isDeleted: false,
      deletedAt: null,
    });
    return res.status(200).json({ status: "SUCCESS", data: users });
  } catch (error) {
    res.status(500).json({ status: "FAILED", message: error.message });
  }
});

// update a user by id => done by the landlord who created the user
const updateAUserById = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    const { userId } = req.params;
    const {
      firstName,
      secondName,
      email,
      phoneNumber,
      roles,
      status,
      description,
      properties,
      units,
    } = req.body;

    if (
      !firstName ||
      !secondName ||
      !email ||
      !phoneNumber ||
      !roles ||
      !status ||
      !description ||
      !properties ||
      !units
    ) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updateUser = await User.findOneAndUpdate(
      { _id: userId, addedBy: _id },
      req.body,
      {
        new: true,
      }
    );

    if (!updateUser) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
      });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "User updated successfully.",
      updateUser,
    });
  } catch (error) {
    return res.status(200).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

// If a user is deleted user state will be updated to deleted
// This is a temporary solution a more robust solution will be provided in the future
const softDeleteAUserById = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id } = req.landlord;
    validateMongoDbId(userId);
    validateMongoDbId(_id);

    const softDeletedUser = User.findOneAndUpdate(
      { _id: userId, addedBy: _id },
      { userState: "Deleted" },
      {
        new: true,
      }
    );
    if (!softDeletedUser) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  addAuser,
  getAUserById,
  getAllUsers,
  updateAUserById,
  softDeleteAUserById,
};

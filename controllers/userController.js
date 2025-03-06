const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");

// add a new user =>Done by landlord
const addAuser = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      firstName,
      secondName,
      email,
      phoneNumber,
      role,
      description,
      property,
    } = req.body;

    if (
      !firstName ||
      !secondName ||
      !email ||
      !phoneNumber ||
      !role ||
      !description ||
      !property
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    validatePhoneNumber(phoneNumber);
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide a valid email address.",
      });
    }

    // check if user already exist by email
    const existingUser = await User.findOne({
      email,
      landlord: req.landlord._id,
    });
    if (existingUser) {
      // check if user is deleted
      if (existingUser.isDeleted) {
        // if the user is deleted restore account
        existingUser.isDeleted = false;
        existingUser.deletedAt = null;
        existingUser.status = "Active";
        await existingUser.save();
        return res.status(201).json({
          status: "SUCCESS",
          message: "User created successfully.",
          data: existingUser,
        });
      } else {
        return res.status(400).json({
          status: "FAILED",
          message:
            "A user with this email already exist. Please double check your email address or use a different email.",
        });
      }
    }
    // otherwise create the user if he/she does not exist
    const user = await User.create({ ...req.body, landlord: _id });
    return res.status(201).json({
      status: "SUCCESS",
      message: "User added successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// get a user by id => Done by landlord related to that user/was created by the landlord
const getAUserById = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    const { userId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(userId);

    // only get a user if the user is not deleted
    const user = await User.findOne({
      _id: userId,
      landlord: _id,
      isDeleted: false,
    })
      .populate("role")
      .populate("property");
    if (!user) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// get all users related to a particular landlord=>get all the user who are not deleted
const getAllUsers = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields"];
    excludeFields.forEach((el) => delete queryObject[el]);

    // convert the query object to json string
    let queryString = JSON.stringify(queryObject);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    // return only users who are not deleted and who are related to the current logged in landlord
    let query = User.find({
      ...JSON.parse(queryString),
      isDeleted: false,
      deletedAt: null,
      landlord: req.landlord._id,
    }) //populate role and property fields from the database
      .populate("role")
      .populate("property");

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }
    // field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }
    // pagination
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    query = query.skip(offset).limit(limit);
    const users = await query;
    return res.status(200).json({ status: "SUCCESS", data: users });
  } catch (error) {
    next(error);
  }
});

// update a user by id => done by the landlord who created the user
const updateAUserById = expressAsyncHandler(async (req, res, next) => {
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
    next(error);
  }
});

// If a user is deleted user state will be updated to deleted
// This is a temporary solution a more robust solution will be provided in the future
const softDeleteAUserById = expressAsyncHandler(async (req, res, next) => {
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
    next(error);
  }
});

module.exports = {
  addAuser,
  getAUserById,
  getAllUsers,
  updateAUserById,
  softDeleteAUserById,
};

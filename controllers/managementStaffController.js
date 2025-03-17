const expressAsyncHandler = require("express-async-handler");
const ManagementStaff = require("../models/managementStaffModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");

// add a new management staff => Done by landlord
const addAManagementStaff = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const { firstName, secondName, email, phoneNumber, role, description } =
      req.body;
    if (!firstName || !secondName || !email || !phoneNumber || !role || !description) {
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

    // check if managementstaff already exist by email
    const existingManagementStaff = await ManagementStaff.findOne({
      email,
      landlord: req.landlord._id,
    });
    if (existingManagementStaff) {
      // check if managementstaff is deleted
      if (existingManagementStaff.isDeleted) {
        // if the managementstaff is deleted restore account
        existingManagementStaff.isDeleted = false;
        existingManagementStaff.deletedAt = null;
        existingManagementStaff.status = "Active";
        await existingManagementStaff.save();
        return res.status(201).json({
          status: "SUCCESS",
          message: "ManagementStaff created successfully.",
          data: existingManagementStaff,
        });
      } else {
        return res.status(400).json({
          status: "FAILED",
          message:
            "A managementstaff with this email already exist. Please double check your email address or use a different email.",
        });
      }
    }
    // otherwise create the managementstaff if he/she does not exist
    const managementstaff = await ManagementStaff.create({
      ...req.body,
      landlord: _id,
      firstName: _.startCase(_.toLower(firstName)),
      secondName: _.startCase(_.toLower(secondName)),
      description: descriptionFormater(description),
    });
    return res.status(201).json({
      status: "SUCCESS",
      message: "ManagementStaff added successfully.",
      data: managementstaff,
    });
  } catch (error) {
    next(error);
  }
});



// get a managementstaff by id => Done by landlord related to that managementstaff/was created by the landlord
const getAManagementStaffById = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    const { managementstaffId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(managementstaffId);

    // only get a managementstaff if the managementstaff is not deleted
    const managementstaff = await ManagementStaff.findOne({
      _id: managementstaffId,
      landlord: _id,
      isDeleted: false,
    })
      .populate("role")
      .populate("property");
    if (!managementstaff) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "ManagementStaff not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      data: managementstaff,
    });
  } catch (error) {
    next(error);
  }
});

// get all managementstaffs related to a particular landlord=>get all the managementstaff who are not deleted
const getAllManagementStaffs = expressAsyncHandler(async (req, res, next) => {
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
    // its 
    // return only managementStaffs who are not deleted and who are related to the current logged in landlord
    let query = ManagementStaff.find({
      ...JSON.parse(queryString),
      isDeleted: false,
      deletedAt: null,
      landlord: req.landlord._id,
    }) //populate role and property fields from the database
      .populate({ path: "role", select: "name" })
      .populate({ path: "properties", select: "name" });

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
    const managementStaffs = await query;
    return res.status(200).json({ status: "SUCCESS", data: managementStaffs });
  } catch (error) {
    next(error);
  }
});

// update a managementstaff by id => done by the landlord who created the managementstaff
const updateAManagementStaff = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    const { managementStaffId } = req.params;
    const { firstName, secondName, email, phoneNumber, role, description } = req.body;
    if (!firstName || !secondName || !email || !phoneNumber || !role || !description) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updatedManagementStaff = await ManagementStaff.findOneAndUpdate(
      { _id: managementStaffId, landlord: _id, isDeleted: false, deletedAt: null },
      {
        ...req.body,
        firstName: _.startCase(_.toLower(firstName)),
        secondName: _.startCase(_.toLower(secondName)),
        description: descriptionFormater(description),
      },
      {
        new: true,
      }
    );

    if (!updatedManagementStaff) {
      return res.status(404).json({
        status: "FAILED",
        message: "ManagementStaff not found.",
      });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "ManagementStaff updated successfully.",
      updatedManagementStaff,
    });
  } catch (error) {
    next(error);
  }
});

// If a managementstaff is deleted managementstaff state will be updated to deleted
// This is a temporary solution a more robust solution will be provided in the future
const deleteAManagementStaff = expressAsyncHandler(async (req, res, next) => {
  try {
    const { managementStaffId } = req.params;
    const { _id } = req.landlord;
    validateMongoDbId(managementStaffId);
    validateMongoDbId(_id);
    const deletedManagementStaff = ManagementStaff.findOneAndUpdate(
      { _id: managementStaffId, landlord: _id },
      { isDeleted: true, deletedAt: Date.now() },
      {
        new: true,
      }
    );
    if (!deletedManagementStaff) {
      return res.status(404).json({
        status: "FAILED",
        message: "ManagementStaff not found.",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = {
  addAManagementStaff,
  getAManagementStaffById,
  getAllManagementStaffs,
  updateAManagementStaff,
  deleteAManagementStaff,
};

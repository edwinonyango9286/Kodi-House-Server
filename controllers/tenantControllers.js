const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");

// general update for a tenant by landlord => only update a tenant whose account is not deleted
const updateTenantDetailsLandlord = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      validateMongoDbId(tenantId);
      const { firstName, secondName, email, phoneNumber } = req.body;
      if (!firstName || !secondName || !email || !phoneNumber) {
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
      const updatedTenant = await User.findOneAndUpdate(
        {
          _id: tenantId,
          landlord: req.landlord._id,
          isDeleted: false,
          deletedAt: null,
        },
        {
          ...req.body,
          // change the first letters of the names to uppercase
          firstName: _.startCase(_.toLower(firstName)),
          secondName: _.startCase(_.toLower(secondName)),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!updatedTenant) {
        return res.status(404).json({
          status: "FAILED",
          message: "Tenant not found.",
        });
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Tenant Updated successfully.",
        data: updatedTenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// update tenant =>tenant
const updateTenantDetailsTenant = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      validateMongoDbId(tenantId);
      const { firstName, secondName, email, phoneNumber } = req.body;
      if (!firstName || !secondName || !email || !phoneNumber) {
        return res.status(400).json({
          status: "FAILED",
          message: "Please provide all required fileds.",
        });
      }
      validatePhoneNumber(phoneNumber);
      if (!emailValidator.validate(email)) {
        return res.status(400).json({
          status: "FAILED",
          message: "Please provide a valid email address.",
        });
      }
      const updatedTenant = await Tenant.findOneAndUpdate(
        {
          _id: tenantId,
          isDeleted: false,
          deletedAt: null,
        },
        {
          ...req.body,
          // change the first letters of the names to uppercase
          firstName: _.startCase(_.toLower(firstName)),
          secondName: _.startCase(_.toLower(secondName)),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!updatedTenant) {
        return res
          .status(404)
          .json({ status: "FAILED", message: "Tenant not found." });
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Tenant Updated successfully.",
        data: updatedTenant,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);

// landlord disable Tenant account
const disableTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    // disbale tenant=> update tenant status to disabled
    const disabledTenant = await User.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
      },
      {
        accountStatus: "Disabled",
      },
      { new: true, runValidators: true }
    );
    if (!disabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account disbaled successfully.",
      data: disabledTenant,
    });
  } catch (error) {
    next(error);
  }
});

const activateTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const enabledTenant = await User.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.landlord._id,
      },
      { accountStatus: "Active" },
      { new: true, runValidators: true }
    );

    if (!enabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account enabled successfully.",
      data: enabledTenant,
    });
  } catch (error) {
    next(error);
  }
});

// get all tenants related to a particular landlord=>gets all tenants whose account are not deleted
const getAllTenants = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields"];
    excludeFields.forEach((element) => delete queryObject[element]);

    let queryString = JSON.stringify(queryObject);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // get only tenants who are not deleted and who are related to a particular logged in landlord
    let query = User.find({
      ...JSON.parse(queryString),
      isDeleted: false,
      deletedAt: null,
      landlord: req.landlord._id,
    })
      .populate({ path: "createdBy", select: "userName" })
      // a tenant can have more than one property assigned to them
      .populate({ path: "properties", select: "name" })
      //  a tenant can have more that one unit assigned to them
      .populate({ path: "units", select: "unitNumber" });
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

    const tenants = await query;
    return res.status(200).json({ status: "SUCCESS", data: tenants });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

//Delete a tenant => landlord
const deleteTenantLandlord = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const deletedTenant = await User.findOneAndUpdate(
      { landlord: req.landlord._id, _id: tenantId },
      {
        isDeleted: true,
        deletedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!deletedTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant Account deleted successfully.",
      data: deletedTenant,
    });
  } catch (error) {
    next(error);
  }
});

// Tenant deletes own account => Tenant
const deleteTenantTenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const deletedTenant = await User.findOneAndUpdate(
      {
        _id: req.tenant._id,
      },
      { isDeleted: true, deletedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!deletedTenant) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant deleted successfully.",
      data: deletedTenant,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  updateTenantDetailsLandlord,
  getAllTenants,
  disableTenant,
  activateTenant,
  updateTenantDetailsTenant,
  deleteTenantLandlord,
  deleteTenantTenant,
};

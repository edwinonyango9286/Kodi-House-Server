const expressAsyncHandler = require("express-async-handler");
const Tenant = require("../models/tenantModel");
const logger = require("../utils/logger");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");

// general update for a tenant by landlord => only update a tenant whose account is not deleted
const updateATenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    const updatedTenant = await Tenant.findOneAndUpdate(
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
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res
      .status(200)
      .json({ status: "SUCCESS", message: "Tenant Updated successfully." });
  } catch (error) {
    next(error);
  }
});

// landlord disable Tenant account
const disableTenantAccount = expressAsyncHandler(async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    validateMongoDbId(tenantId);
    // disbale tenant=> update tenant status to disabled
    const disabledTenant = await Tenant.findOneAndUpdate(
      {
        _id: tenantId,
        landlord: req.body._id,
      },
      {
        accountStatus: "Disabled",
      },
      { new: true }
    );
    if (!disabledTenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Tenant account disbaled successfully.",
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
    let query = Tenant.find({
      ...JSON.parse(queryString),
      isDeleted: false,
      deletedAt: null,
      landlord: req.landlord._id,
    })
      .populate("landlord")
      // a tenant can have more than one property assigned to them
      .populate("properties")
      //  a tenant can have more that one unit assigned to them
      .populate("units");

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = req.sort(sortBy);
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

// get all tenants whose accounts are deleted  => by landlord
const getAllDeletedTenants = expressAsyncHandler(async (req, res, next) => {
  try {
    const deletedTenants = await Tenant.find({
      landlord: req.landlord._id,
      isDeleted: true,
      accountStatus: "Diasbled",
    });

    return res.status(200).json({ status: "SUCCESS", data: deletedTenants });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  updateATenant,
  getAllDeletedTenants,
  getAllTenants,
  disableTenantAccount,
};

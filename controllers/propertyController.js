const Property = require("../models/propertyModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const Tenant = require("../models/tenantModel");
const _ = require("lodash");

const toSentenceCase = (str) => {
  return str
    .toLowerCase() // Convert the entire string to lower case
    .split(/(?<=[.!?])\s+/) // Split the string into sentences
    .map((sentence) => _.capitalize(sentence)) // Capitalize each sentence
    .join(" "); // Join the sentences back together
};

// add a new property
const addAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    const {
      name,
      category,
      type,
      numberOfUnits,
      rent,
      briefDescription,
      googleMap,
      images,
      location,
      currentStatus,
    } = req.body;
    if (
      !name ||
      !category ||
      !type ||
      !numberOfUnits ||
      !rent ||
      !briefDescription ||
      !googleMap ||
      !images ||
      !location ||
      !currentStatus
    ) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    // check for existing property by name
    const existingProperty = await Property.findOne({
      landlord: _id,
      name: _.startCase(_.toLower(name)),
    });
    if (existingProperty) {
      // if property exists and has been deleted restore the property
      if (existingProperty.isDeleted) {
        (existingProperty.isDeleted = false),
          (existingProperty.deletedAt = null),
          await existingProperty.save();
        return res.status(201).json({
          status: "SUCCESS",
          message: "Property created successfully.",
          data: existingProperty,
        });
      } else {
        return res.status(400).json({
          status: "FAILED",
          message: "A property with a simillar name already exist.",
        });
      }
    }
    const newProperty = await Property.create({
      ...req.body,
      name: _.startCase(_.toLower(name)),
      briefDescription: toSentenceCase(briefDescription),
      landlord: _id,
    });
    return res.status(201).json({
      status: "SUCCESS",
      message: "Property created successfully.",
      data: newProperty,
    });
  } catch (error) {
    next(error);
  }
});

// update a property
const updateAproperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.landlord;
    const { propertyId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(propertyId);

    const {
      name,
      category,
      type,
      numberOfUnits,
      rent,
      briefDescription,
      googleMap,
      images,
      location,
      currentStatus,
    } = req.body;
    if (
      !name ||
      !category ||
      !type ||
      !numberOfUnits ||
      !rent ||
      !briefDescription ||
      !googleMap ||
      !images ||
      !location ||
      !currentStatus
    ) {
      return res.status(404).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const updatedProperty = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        landlord: _id,
      },
      {
        ...req.body,
        name: _.startCase(_.toLower(name)),
        briefDescription: toSentenceCase(briefDescription),
      },
      { new: true }
    );

    if (!updatedProperty) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Property not found." });
    }

    return res.status(200).json({ status: "SUCCESS", data: updatedProperty });
  } catch (error) {
    next(error);
  }
});

// get a property by id users
const getAPropertyByIdUsers = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findOne({
      _id: propertyId,
      isDeleted: false,
      deletedAt: null,
    });
    if (!property) {
      return res
        .status(200)
        .json({ status: "FAILED", message: "Property not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: property });
  } catch (error) {
    next(error);
  }
});

// get a property by Id=> for landlord
const getApropertyByIdLandlord = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    validateMongoDbId(propertyId);
    const property = await Property.findOne({
      landlord: req.landlord._id,
      _id: propertyId,
      isDeleted: false,
      deletedAt: null,
    })
      .populate("currentOccupant")
      .populate("users");
    if (!property) {
      return res
        .status(404)
        .json({ status: "SUCCESS", message: "Property not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: property });
  } catch (error) {
    next(error);
  }
});

// get all properties related to the landlord=>by the landlord
const getAllPropertiesByLandlord = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { _id } = req.landlord;
      validateMongoDbId(_id);

      const queryObject = { ...req.query };
      const excludeFields = ["page", "sort", "limit", "offset", "fields"];
      // delete exluded fields in the queryObject
      excludeFields.forEach((element) => delete queryObject[element]);

      let queryString = JSON.stringify(queryObject);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );

      let query = Property.find({
        ...JSON.parse(queryString),
        isDeleted: false,
        deletedAt: null,
        landlord: _id,
      }) //populate for landlord
        .populate("landlord")
        .populate("currentOccupant")
        .populate("users");

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

      const properties = await query;
      return res.status(200).json({ status: "SUCCESS", properties });
    } catch (error) {
      next(error);
    }
  }
);

// get all properties by all users
const getAllPropertiesByAllUsers = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const queryObject = { ...req.query };
      const excludeFields = ["page", "sort", "limit", "offset", "fields"];
      excludeFields.forEach((element) => delete queryObject[element]);

      let queryString = JSON.stringify(queryObject);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );

      //do not return deleted properties
      let query = Property.find({
        ...JSON.parse(queryString),
        isDeleted: false,
        deletedAt: null,
      })
        .populate("landlord")
        .populate("currentOccupant")
        .populate("users");

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

      const properties = await query;
      return res.status(200).json({ status: "SUCCESS", data: properties });
    } catch (error) {
      next(error);
    }
  }
);

// asign a property and to a tenant=> only properties that there type are single unit can be asigned to a single tenant
const asignPropertyToAtenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { tenantId } = req.body;
    validateMongoDbId(propertyId);
    validateMongoDbId(tenantId);
    const tenant = await Tenant.findOne({
      _id: tenantId,
      landlord: req.landlord._id,
      isDeleted: false,
      deletedAt: null,
    });

    if (!tenant) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Tenant not found." });
    }

    // check if a property is already assigned to another tenant
    const property = await Property.findOne({
      _id: propertyId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!property) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Property not found." });
    }

    // ensures that only properties that are single unit are asigned to a single tenant.
    if (property.type === "Multi Unit") {
      return res.status(400).json({
        status: "FAILED",
        message: "A multi unit property cannot be assigned to a single tenant",
      });
    }

    if (property.currentOccupant && property.currentStatus === "Occupied") {
      return res.status(400).json({
        status: "FAILED",
        message: "Property already assigned to a tenant.",
      });
    }
    // if property doesn't have  and tenant occupant and status is vacant asign the property to the tenant
    property.currentOccupant = tenantId;
    property.currentStatus = "Occupied";
    property.runValidators = true;
    property.new = true;
    const assignedProperty = await property.save();

    tenant.properties.push(propertyId);
    const assignedTenant = await tenant.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: `${property.name} has been assigned to  ${tenant.firstName} ${tenant.secondName}`,
      assignedProperty,
      assignedTenant,
    });
  } catch (error) {
    next(error);
  }
});

// vacate tenant from a property
const vacateATenantFromAProperty = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { propertyId } = req.params;
      validateMongoDbId(propertyId);

      // find property
      const property = await Property.findOne({
        _id: propertyId,
        landlord: req.landlord._id,
      });
      if (!property) {
        return res
          .status(404)
          .json({ status: "Failed", message: "Property not found." });
      }

      // find tenant
      const tenant = await Tenant.findOne({
        _id: property.currentOccupant,
        landlord: req.landlord._id,
        properties: { $in: [propertyId] },
      });
      // remove property id from
      tenant.properties.pull(propertyId);
      const vacatedTenant = await tenant.save();

      property.currentOccupant = null;
      property.currentStatus = "Vacant";
      const vacatedProperty = await property.save();

      return res.status(200).json({
        status: "SUCCESS",
        message: `${vacatedTenant.firstName} ${vacatedTenant.secondName} has been vacated from  ${property.name}`,
        vacatedTenant,
        vacatedProperty,
      });
    } catch (error) {
      next(error);
    }
  }
);

// delete a property
const deleteAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    validateMongoDbId(propertyId);
    const deletedProperty = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        landlord: req.landlord._id,
      },
      { isDeleted: true, deletedAt: Date.now() },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!deletedProperty) {
      return res.status({ status: "SUCCESS", message: "Property not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      data: deletedProperty,
      message: "Property updated successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  addAProperty,
  getApropertyByIdLandlord,
  getAllPropertiesByLandlord,
  getAllPropertiesByAllUsers,
  updateAproperty,
  deleteAProperty,
  asignPropertyToAtenant,
  getAPropertyByIdUsers,
  vacateATenantFromAProperty,
};

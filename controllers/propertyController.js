const Property = require("../models/propertyModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");

// add a new property
const addAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    validateMongoDbId(_id);
    const {name,category,type,numberOfUnits,rent,briefDescription,googleMap,images,location,currentStatus} = req.body;
    if ( !name || !category || !type || !numberOfUnits || !rent || !briefDescription || !googleMap || !images || !location || !currentStatus) {
      return res.status(404).json({status: "FAILED",message: "Please provide all the required fields.",})}
    // check for existing property by name
    const existingProperty = await Property.findOne({ owner: _id, name: _.startCase(_.toLower(name)), isDeleted: false, deletedAt: null});
    if (existingProperty) {
      return res.status(409).json({  status: "FAILED",  message: `Property ${existingProperty.name} already exist.`,})
    }
    const newProperty = await Property.create({...req.body,name: _.startCase(_.toLower(name)),briefDescription: descriptionFormater(briefDescription),owner: _id,});
    return res.status(201).json({status: "SUCCESS",message: "Property created successfully.",data: newProperty});
  } catch (error) {
    next(error);
  }
});

// update a property
const updateAproperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { propertyId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(propertyId);

    const {name,category,type,numberOfUnits,rent,briefDescription, googleMap,images,location,currentStatus} = req.body;
    if (
      !name || !category ||!type || !numberOfUnits ||!rent ||!briefDescription ||!googleMap || !images ||!location || !currentStatus) {
      return res.status(404).json({ status: "FAILED", message: "Please provide all the required fields."});
    }
    const updatedProperty = await Property.findOneAndUpdate(
      {_id: propertyId, owner: _id,},
      { ...req.body, name: _.startCase(_.toLower(name)), briefDescription: descriptionFormater(briefDescription),},
      { new: true, runValidators: true }
    );
    if (!updatedProperty) {
      return res.status(404).json({ status: "FAILED", message: "Property not found." });
    }
    return res.status(200).json({ status: "SUCCESS", data: updatedProperty });
  } catch (error) {
    next(error);
  }
});

const getApropertyById = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    validateMongoDbId(propertyId);
    // Build the query object
    const query = {
      _id: propertyId,
      isDeleted: false,
      deletedAt: null,
    };

    // If the request is from a owner, add the owner check
    if (req.user && req.user._id) {
      query.owner = req.user._id;
    }

    const property = await Property.findOne(query)
      .populate({ path: "owner", select: "userName" })
      .populate({ path: "type", select: "name" })
      .populate({ path: "category", select: "name" })
      .populate({ path: "currentOccupant", select: "firstName secondName" })
      .populate({ path: "users", select: "firstName secondName" });

    if (!property) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Property not found." });
    }

    return res.status(200).json({ status: "SUCCESS", data: property });
  } catch (error) {
    next(error);
  }
});

const getAllProperties = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields"];
    excludeFields.forEach((el) => delete queryObject[el]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Property.find({...JSON.parse(queryStr),isDeleted: false,deletedAt: null,})
    .populate({path: "createdBy",select: "userName",populate: { path: "role",select: "name"}})
    .populate("currentOccupant", "firstName secondName")
    .populate("type", "name")
    .populate("category", "name");

    if (req.user?.role?.name === "Landlord") {
      query = query.where("createdBy").equals(req.user._id);
    }

    if (req.query.sort) query = query.sort(req.query.sort.split(",").join(" "));
    if (req.query.fields) query = query.select(req.query.fields.split(",").join(" "));
    
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    const properties = await query.skip(skip).limit(limit);
    
   return res.status(200).json({status: "SUCCESS", message:"Properties listed successfully.", data: properties,});
  } catch (error) {
    next(error);
  }
});



// asign a property and to a tenant=> only properties that there type are single unit can be asigned to a single tenant
const asignPropertyToAtenant = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { tenantId } = req.body;
    validateMongoDbId(propertyId);
    validateMongoDbId(tenantId);
    const tenant = await Tenant.findOne({
      _id: tenantId,
      owner: req.user._id,
      isDeleted: false,
      deletedAt: null,
    });

    if (!tenant) {
      return res.status(404).json({ status: "FAILED", message: "Tenant not found." });
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
    if (property.type.name === "Multi Unit") {
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
        owner: req.user._id,
        isDeleted: false,
        deletedAt: null,
      });
      if (!property) {
        return res
          .status(404)
          .json({ status: "Failed", message: "Property not found." });
      }

      // find tenant
      const tenant = await Tenant.findOne({
        _id: property.currentOccupant,
        owner: req.user._id,
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
        owner: req.user._id,
        isDeleted: false,
        deletedAt: null,
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
      message: "Property deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { addAProperty, getApropertyById, getAllProperties,updateAproperty,deleteAProperty, asignPropertyToAtenant,vacateATenantFromAProperty,};

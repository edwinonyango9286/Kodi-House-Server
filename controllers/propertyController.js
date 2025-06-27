const Property = require("../models/propertyModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const  User = require("../models/userModel")

// add a new property
const addAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    validateMongoDbId(_id);
    const {name,category,type,numberOfUnits,rent,briefDescription,googleMap,images,location,currentStatus} = req.body;
    if ( !name || !category || !type || !numberOfUnits || !rent || !briefDescription || !googleMap || !images || !location || !currentStatus) {
      return res.status(404).json({status: "FAILED",message: "Please provide all the required fields.",})}

    // check for existing property by name for that particular landlord
    const existingProperty = await Property.findOne({ createdBy: _id, name: _.startCase(_.toLower(name)), isDeleted: false, deletedAt: null});
    if (existingProperty) {
      return res.status(409).json({  status: "FAILED",  message: `Property ${existingProperty.name} already exist.`,})
    }
    const newProperty = await Property.create({...req.body,name: _.startCase(_.toLower(name)),briefDescription: descriptionFormater(briefDescription),createdBy: _id,});
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
    if ( !name || !category ||!type || !numberOfUnits ||!rent || !briefDescription || !googleMap || !images || !location || !currentStatus) {
      return res.status(404).json({ status: "FAILED", message: "Please provide all the required fields."});
    }
    const updatedProperty = await Property.findOneAndUpdate( {_id: propertyId, createdBy: _id,}, { ...req.body, name: _.startCase(_.toLower(name)), briefDescription: descriptionFormater(briefDescription)},{ new: true, runValidators: true });
    if (!updatedProperty) {
      return res.status(404).json({ status: "FAILED", message: "Property not found." });
    }
    return res.status(200).json({ status: "SUCCESS", message:`Property ${updatedProperty.name} updated successfully`, data: updatedProperty });
  } catch (error) {
    next(error);
  }
});

const getApropertyById = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    validateMongoDbId(propertyId);
    const query = { _id: propertyId, isDeleted: false, deletedAt: null};
    const property = await Property.findOne(query).populate({ path: "createdBy", select: "userName" }).populate({ path: "type", select: "name" }).populate({ path: "category", select: "name" }).populate({ path: "currentOccupant", select: "firstName secondName" }).populate({ path: "users", select: "firstName secondName" });
    if (!property) { return res.status(404).json({ status: "FAILED", message: "Property not found." })}
    return res.status(200).json({ status: "SUCCESS", data: property });
  } catch (error) {
    next(error);
  }
});

const getAllProperties = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields", "search"];
    excludeFields.forEach((el) => delete queryObject[el]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const userMakingRequest = await User.findOne({ _id: req?.user?._id }).populate("role", "name");

    let query;
    let baseQuery = JSON.parse(queryStr);

    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      baseQuery.$or = [ { name: searchRegex } , { type: searchRegex },{ category: searchRegex },{currentStatus: searchRegex}];
    }

    if( userMakingRequest && userMakingRequest.role.name === "Admin") {
      query = Property.find({...baseQuery, isDeleted:false, deletedAt:null}).populate({ path: "createdBy", select: "userName" }).populate("currentOccupant", "firstName secondName");
    } else if ( userMakingRequest && userMakingRequest.role.name === "Landlord") { query = Property.find({ ...baseQuery, isDeleted: false, deletedAt: null, createdBy: req?.user?._id}).populate("currentOccupant", "firstName secondName");
    } else {
      query = Property.find({...baseQuery, isDeleted: false, deletedAt: null, currentOccupant: null }).populate({ path: "createdBy", select: "userName" });
    }
    
    // Rest of your existing code...
    if (req.query.sort) query = query.sort(req.query.sort.split(",").join(" "));
    if (req.query.fields) query = query.select(req.query.fields.split(",").join(" "));
    
    const limit = parseInt(req.query.limit) || 10;
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    query = query.skip(offset).limit(limit);

    const properties = await query;
    const totalCount = await Property.countDocuments(query.getFilter()); 
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({ status: "SUCCESS",  message: "Properties listed successfully.",  data: properties, totalCount,  totalPages,  limit,  offset  });
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
    const tenant = await User.findOne({_id: tenantId, createdBy: req.user._id, isDeleted: false, deletedAt: null });

    if (!tenant) {
      return res.status(404).json({ status: "FAILED", message: "Tenant not found." });
    }

    // check if a property is already assigned to another tenant
    const property = await Property.findOne({ _id: propertyId, createdBy:req.user._id, isDeleted: false, deletedAt: null ,});

    if (!property) {
      return res.status(404).json({ status: "FAILED", message: "Property not found." });
    }

    // ensures that only properties that are single unit are asigned to a single tenant.
    if (property.type === "Multi Unit") {
      return res.status(400).json({ status: "FAILED", message: "A multi unit property cannot be assigned to a single tenant" });
    }

    if (property.currentOccupant && property.currentStatus === "Occupied") {
      return res.status(400).json({ status: "FAILED", message: "Property already assigned to a tenant.", });
    }
    // if property doesn't have  and tenant occupant and status is vacant asign the property to the tenant
    property.currentOccupant = tenantId;
    property.currentStatus = "Occupied";
    property.runValidators = true;
    property.new = true;
    const assignedProperty = await property.save();

    tenant.properties.push(propertyId);
    const assignedTenant = await tenant.save();

    return res.status(200).json({ status: "SUCCESS", message: `${property.name} has been assigned to  ${tenant.firstName} ${tenant.secondName}`, assignedProperty, assignedTenant });
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
      const property = await Property.findOne({_id: propertyId, createdBy: req.user._id, isDeleted: false, deletedAt: null, });
      if (!property) {
        return res.status(404).json({ status: "Failed", message: "Property not found." });
      }

      // find tenant
      const tenant = await User.findOne({_id: property.currentOccupant, createdBy: req.user._id, properties: { $in: [propertyId] } });
      // remove property id from
      tenant.properties.pull(propertyId);
      const vacatedTenant = await tenant.save();

      property.currentOccupant = null;
      property.currentStatus = "Vacant";
      const vacatedProperty = await property.save();

      return res.status(200).json({ status: "SUCCESS", message: `${vacatedTenant.firstName} ${vacatedTenant.secondName} has been vacated from  ${property.name}`, vacatedTenant, vacatedProperty });
    } catch (error) {
      next(error);
    }
  }
);


// only landlords can delete properties
const deleteAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    console.log(propertyId,"=>propertyId")
    validateMongoDbId(propertyId);
    
    const deletedProperty = await Property.findOneAndUpdate({ _id: propertyId, createdBy: req.user._id, isDeleted: false,  deletedAt: null }, { isDeleted: true, deletedAt: Date.now() }, {  new: true, runValidators: true, });
    if (!deletedProperty) { return res.status(404).json({ status: "SUCCESS", message: "Property not found." }) }
    return res.status(200).json({ status: "SUCCESS", data: deletedProperty, message: "Property deleted successfully.", });
  } catch (error) {
    next(error);
  }
});


module.exports = { addAProperty, getApropertyById, getAllProperties,updateAproperty,deleteAProperty, asignPropertyToAtenant,vacateATenantFromAProperty};

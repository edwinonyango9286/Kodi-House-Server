const Property = require("../models/propertyModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const  User = require("../models/userModel");
const logger = require("../utils/logger")

const addAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    validateMongoDbId(_id);
    const {name,category,type,rent,briefDescription,images,location,currentStatus} = req.body;
    if ( !name || !category || !type || !rent || !briefDescription  || !images || !location || !currentStatus) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields."})}
    const existingProperty = await Property.findOne({ createdBy: _id, name: _.startCase(_.toLower(name)), isDeleted: false, deletedAt: null});
    if (existingProperty) {
      return res.status(409).json({ status: "FAILED",  message: `Property ${existingProperty.name} already exist.`})
    }
    const newProperty = await Property.create({...req.body, name: _.startCase(_.toLower(name)),briefDescription: descriptionFormater(briefDescription),createdBy: _id,});
    if(newProperty){
      const updateUserListOfUserPropeties = await User.findOneAndUpdate({_id:req.user._id },{$push : { properties: newProperty._id} },{ new:true },{ runValidators:true })
    }
    return res.status(201).json({status: "SUCCESS",message: "Property created successfully.",data: newProperty});
  } catch (error) {
    next(error);
  }
});



const updateAproperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { propertyId } = req.params;
    validateMongoDbId(_id);
    validateMongoDbId(propertyId);

    const {name,category,type,rent,briefDescription,images,location,currentStatus} = req.body;
    if ( !name || !category ||!type ||!rent || !briefDescription || !images || !location || !currentStatus) {
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

    const userMakingRequest = await User.findOne({ _id: req.user._id }).populate("role", "name");
    if(!userMakingRequest){
      return res.status(404).json({ status:"FAILED", message:"User not found." })
    }
    let query;
    let baseQuery = JSON.parse(queryStr);

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      baseQuery.$or = [ { name: searchRegex } , { type: searchRegex },{ category: searchRegex },{currentStatus: searchRegex}];
    }

    if( userMakingRequest && userMakingRequest.role.name === "Admin") {
      query = Property.find({...baseQuery}).populate({ path: "createdBy", select: "userName" }).populate("currentOccupant", "firstName secondName").sort({ createdAt:-1});
    } else if ( userMakingRequest && userMakingRequest.role.name === "Landlord") { 
      query = Property.find({ ...baseQuery, isDeleted: false, deletedAt: null, createdBy: req?.user?._id}).populate("currentOccupant", "firstName secondName");
    } else {
      query = Property.find({...baseQuery, isDeleted: false, deletedAt: null, currentOccupant: null }).populate({ path: "createdBy", select: "userName" });
    }
    
    query = query.sort({ createdAt:-1})
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

    const property = await Property.findOne({ _id: propertyId, createdBy:req.user._id, isDeleted: false, deletedAt: null ,});

    if (!property) {
      return res.status(404).json({ status: "FAILED", message: "Property not found." });
    }

    if (property.type === "Multi Unit") {
      return res.status(400).json({ status: "FAILED", message: "A multi unit property cannot be assigned to a single tenant" });
    }

    if (property.currentOccupant && property.currentStatus === "Occupied") {
      return res.status(400).json({ status: "FAILED", message: "Property already assigned to a tenant.", });
    }
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


const vacateATenantFromAProperty = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { propertyId } = req.params;
      validateMongoDbId(propertyId);

      const property = await Property.findOne({_id: propertyId, createdBy: req.user._id, isDeleted: false, deletedAt: null, });
      if (!property) {
        return res.status(404).json({ status: "Failed", message: "Property not found." });
      }
      const tenant = await User.findOne({_id: property.currentOccupant, createdBy: req.user._id, properties: { $in: [propertyId] } });
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


const deleteAProperty = expressAsyncHandler(async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    console.log(propertyId)
    validateMongoDbId(propertyId);
  const userMakingRequest = await User.findOne({ _id:req.user._id}).populate("role","name");
  let deletedProperty;
  if(userMakingRequest.role.name === "Admin"){
    deletedProperty = await Property.findOneAndUpdate({ _id: propertyId, isDeleted: false,  deletedAt: null }, { isDeleted: true, deletedAt: Date.now() }, {  new: true, runValidators: true, });
  }else {
    deletedProperty = await Property.findOneAndUpdate({ _id: propertyId, createdBy:req.user._id, isDeleted: false,  deletedAt: null }, { isDeleted: true, deletedAt: Date.now() }, {  new: true, runValidators: true, });
  }
    if (!deletedProperty) { return res.status(404).json({ status: "SUCCESS", message: "Property not found." }) }
    return res.status(200).json({ status: "SUCCESS",  message: "Property deleted successfully.", data: deletedProperty });
  } catch (error) {
    next(error);
  }
});


// only admin should be able to restore deleted property
const restoreProperty = expressAsyncHandler( async (req,res,next)=>{
  try {
    const propertyId  = req.params.propertyId;
    validateMongoDbId(propertyId);
    if(!propertyId){
      return res.status(400).json({ message:"Property Id not provided."});
    }
    const restoredProperty = await Property.findOneAndUpdate({ _id:propertyId, isDeleted:true, deletedAt:{ $ne:null } },{ isDeleted:false, deletedAt:null }, { new:true, runValidators:true});
    if(!restoredProperty){
      return res.status(404).json({ status:"FALSE", message:"Property not found."})
    }
    return res.status(200).json({ status:"SUCCESS", message:"Property restored successfully.", data:restoredProperty})
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

const bulkDeleteProperties = expressAsyncHandler(async (req,res,next)=>{
  try {
    const propertyIds = req.body.propertyIds
    if(propertyIds.length === 0){
      return res.status(400).json({ status:"FAILED", message:"No property selected for deletion."})
    }
    const deletedProperties = await Property.updateMany({ _id:{ $in:propertyIds}, isDeleted:false },{ deletedBy:req.user._id, deletedAt: new Date(),isDeleted:true}, { new:true, runValidators:true });
    console.log(deletedProperties,"=>deletedProperties")
    if( deletedProperties.matchedCount === 0){
      return res.status(404).json({ status: "FAILED", message: "No deletable properties found. Properties may already have been deleted or do not exist exist." })
    }
    return res.status(200).json({ status:"SUCCESS", message:` ${deletedProperties.modifiedCount} Properties deleted successfully`,   data: { matchedCount: deletedProperties.matchedCount, modifiedCount: deletedProperties.modifiedCount } })
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
});






module.exports = { addAProperty, getApropertyById, getAllProperties,updateAproperty,deleteAProperty, asignPropertyToAtenant,vacateATenantFromAProperty, bulkDeleteProperties, restoreProperty};

const PropertyType = require("../models/propertyTypeModel");
const expressAsyncHandler = require("express-async-handler");
const {descriptionFormater} = require("../utils/stringFormaters");
const validateMongoDbId = require("../utils/validateMongoDbId");
const _ = require("lodash")
const slugify = require("slugify")

const createAPropertyType = expressAsyncHandler(async (req, res, next) => {
  try {
    const {name, description, status} = req.body;
    if(!name || !description || !status){
        return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
    }
    const existingPropertyType = await PropertyType.findOne({ name: _.startCase(_.toLower(name)), isDeleted:false, deletedAt:null})
    if(existingPropertyType){
        return res.status(409).json({ status:"FAILED", message:`Property type ${existingPropertyType.name} already exist.`})
    }
    const propertyType =  await PropertyType.create({...req.body, name:_.startCase(_.toLower(name)), description: descriptionFormater(description), slug: slugify(name), createdBy : req.user._id})
    return res.status(201).json({ status:"SUCCESS", message:"Property type created successfully.", data: propertyType})
  } catch (error) {
    next(error);
  }
});



const updateApropertyType = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {propertyTypeId} = req.params;
        validateMongoDbId(propertyTypeId)
        const {status, description, name} = req.body;
        if(!status || !name || !description){
            return res.status(400).json({ message:"Please provide all the required fields"})
        }
        const updatedPropertyType = await PropertyType.findOneAndUpdate({ _id : propertyTypeId, isDeleted:false, deletedAt:null} , {...req.body, name:_.startCase(_.toLower(name)), description: descriptionFormater(description), updatedBy: req.user._id},  {new:true, runValidators:true })
        if(!updatedPropertyType){
            return res.status(404).json({ status:"FAILED", message:"Property type not found."})
        }
        return res.status(200).json({ status:"SUCCESS", message: "Property type updated successfully.", data:updatedPropertyType})
    } catch (error) {
     next(error)
    }
})


const getApropertyType = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {propertyTypeId} = req.params;
        validateMongoDbId(propertyTypeId)
        const propertyType = await PropertyType.findOne({ _id: propertyTypeId, isDeleted:false, deletedAt:null}).populate({ path:"createdBy", select:"userName"}).populate({ path:"updatedBy", select:"userName"})
        if(!propertyType){
            return res.status(404).json({ status:"FAILED", message:"Property type not found."})
        }
        return res.status(200).json({ status:"SUCCESS", data: propertyType})
    } catch (error) {
        next(error)
    }
})

const getAllPropertyTypes = expressAsyncHandler(async (req, res, next) => {
    try {
      const queryObject = { ...req.query };
      const excludeFields = ["page", "sort", "limit", "fields", "offset"];
      excludeFields.forEach((el) => delete queryObject[el]);
  
      // Directly use the queryObject without modifying it
      let query = PropertyType.find({
        ...queryObject,
        isDeleted: false,
        deletedAt: null,
      })
        .populate({ path: "createdBy", select: "userName" })
        .populate({ path: "updatedBy", select: "userName" });
  
      // Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
  
      // Field limiting
      if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
      } else {
        query = query.select("-__v");
      }
  
      // Pagination
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100) ;
      const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0) 
      query = query.skip(offset).limit(limit);
  
      const propertyTypes = await query;
      const totalCount =  await PropertyType.countDocuments({ isDeleted: false, deletedAt: null ,...queryObject})
      const totalPages = Math.ceil(totalCount / limit)
      
      return res.status(200).json({ status: "SUCCESS", data: propertyTypes, totalCount, limit, offset , totalPages});
    } catch (error) {
      next(error);
    }
  });


const deleteAPropertyType = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {propertyTypeId} = req.params
        validateMongoDbId(propertyTypeId)
        const deletedPropertyType = await PropertyType.findOneAndUpdate({_id: propertyTypeId, isDeleted:false, deletedAt:null}, { isDeleted: true, deletedAt:Date.now() , deletedBy: req.user._id}, { new: true, runValidators:true})
        if(!deletedPropertyType){
            return res.status(404).json({ status:"FAILED", message:"Property type not found."})
        }
        return res.status(200).json({ status:"SUCCESS", message:"Property type deleted successfully.", data: deletedPropertyType})
    } catch (error) {
       next(error) 
    }
})




module.exports = {createAPropertyType, getApropertyType,deleteAPropertyType, updateApropertyType, getAllPropertyTypes}

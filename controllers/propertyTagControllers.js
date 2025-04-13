const expressAsyncHandler = require("express-async-handler");
const PropertyTag = require("../models/propertyTagModel");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
const { default: slugify } = require("slugify");
const validateMongoDbId = require("../utils/validateMongoDbId");

const createAPropertyTag = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, status, description} = req.body;
    if(!name || !status || !description){
        return res.status(400).json({ status:"FAILED", message : "Please provide all the required fields."})
    }
    const existingTag = await PropertyTag.findOne({  name: _.startCase(_.toLower(name)), isDeleted: false , deletedAt:null})
    if(existingTag){
        return res.status(409).json({ status:"FAILED", message:`Property tag ${existingTag.name} already exist.`})
    }
    const createdPropertyTag = await PropertyTag.create({ ...req.body , name: _.startCase(_.toLower(name)) , slug : slugify(name)  , description : descriptionFormater(description), createdBy : req.user._id });
    return res.status(201).json({ status:"SUCCESS", message:"Property tag created successfully." , data: createdPropertyTag})
  } catch (error) {
    next(error);
  }
});

const updateAPropertyTag = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {name,status, description} = req.body;
        if(!name || !status || !description){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
        }
        const {propertyTagId} = req.params
        validateMongoDbId(propertyTagId)

        const updatedPropertyTag = await PropertyTag.findOneAndUpdate({_id: propertyTagId, isDeleted:false, deletedAt:null }, { ...req.body, name:_.startCase(_.toLower(name)), description: descriptionFormater(description), slug: slugify(name) } ,{new :true , runValidators:true})
        if(!updatedPropertyTag){
            return res.status(404).json({ status:"FAILED", message:"Property tag not found."})
        }
        return res.status(200).json({ status:"SUCCESS", message:"Property tag updated successfully", data: updatedPropertyTag})
    } catch (error) {
       next(error) 
    }
})

const getAPropertyTag = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {propertyTagId} = req.params
        validateMongoDbId(propertyTagId)
        const propertyTag = await PropertyTag.findOne({ _id: propertyTagId, isDeleted:false, deletedAt:null})
        if(!propertyTag){
            return res.status(404).json({ status:"FAILED", message:"Property tag not found."})
        }
        return res.status(200).json({ status:"SUCCESS", data:propertyTag})
    } catch (error) {
    next(error)
    }
})

const getAllPropertyTags = expressAsyncHandler(async(req,res,next)=>{
    try {
        const queryObject = {...req.query}
        const excludeFields = ["sort", "page", "limit", "fields", "offset"]
        excludeFields.forEach((el)=> delete queryObject[el]);
        let query = PropertyTag.find({ ...queryObject, isDeleted:false, deletedAt: null}).populate({ path:"createdBy" , select:"userName"}).populate({ path:"updatedBy", select:"userName"})

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
  
      const propertyTags = await query;
      const totalCount = await PropertyTag.countDocuments({...queryObject, isDeleted:false, deletedAt:null})
      const totalPages = Math.ceil(totalCount/ limit)
    return  res.status(200).json({ status:"SUCCESS", data: propertyTags , totalCount, totalPages, limit, offset})
    } catch (error) {
        next(error)
    }
})

const deleteAPropertyTag = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {propertyTagId} = req.params;
       const deletedPropertyTag = await PropertyTag.findOneAndUpdate({ _id: propertyTagId, isDeleted:false, deletedAt:null}, { isDeleted: true, deletedAt: Date.now()},{ new:true, runValidators:true}) 
       if(!deletedPropertyTag){
        return res.status(404).json({ status:"FAILED", message: "Property tag not found."})
       }
       return res.status(200).json({ status:"SUCCESS", message:"Property tag deleted successfully.", data: deletedPropertyTag})
    } catch (error) {
        next(error)
    }
})


module.exports = { createAPropertyTag, getAPropertyTag , deleteAPropertyTag, getAllPropertyTags, updateAPropertyTag}
const expressAsyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const Tag = require("../models/tagModel");
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");
descriptionFormater

const createATag = expressAsyncHandler(async(req, res, next)=>{
    try {
        const {tagName,description,status, parentTag} = req.body
        if(!tagName || !description || !status || !parentTag ){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
        }

        const existingTag = await Tag.findOne({ isDeleted:false,deletedAt:null, tagName:_.startCase(_.toLower(tagName)) })
        if(existingTag){
            return res.status(409).json({ status:"FAILED", message:`Tag ${existingTag.tagName} already exist.`})
        }
        const createdTag = await Tag.create({...req.body, createdBy:req.user._id, tagName:_.startCase(_.toLower(tagName)), description:descriptionFormater(description)})
        return res.status(201).json({ status:"SUCCESS", message:"Tag created successfully.", data:createdTag})

    } catch (error) {
        logger.error(error)
        next(error)
    }
})

const getAllTags = expressAsyncHandler(async(req, res, next)=>{
    try {
       const tags = await Tag.find({ isDeleted:false, deletedAt:null}).populate("createdBy", "userName");
       if(tags){
         return res.status(200).json({ status:"SUCCESS", message:"Tags listed successfully.", data:tags});
       }       
    } catch (error) {
        logger.error(error)
        next(error)
    }
})



module.exports ={ createATag,getAllTags }
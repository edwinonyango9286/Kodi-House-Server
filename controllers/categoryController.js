const expressAsyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const _ = require("lodash")
const Category = require("../models/categoryModel");
const { descriptionFormater } = require("../utils/stringFormaters");



const createCategory = expressAsyncHandler(async(req,res,next)=>{
    try {
        const { categoryName,description, status ,parentCategory } = req.body
        if(!categoryName || !description || !status || !parentCategory){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
        }

        const existingCategory =  await Category.findOne({ isDeleted:false,deletedAt:null, categoryName: _.startCase(_.toLower(categoryName))})
        if(existingCategory){
            return res.status(409).json({ status:"FAILED", message:`Category ${existingCategory.categoryName} already exist.`})
        }

        const createdCategory = await Category.create({...req.body, createdBy:req.user._id, categoryName: _.startCase(_.toLower(categoryName)), description:descriptionFormater(description) });
        if(createdCategory){
         return res.status(201).json({ status:"SUCCESS", message:"Category created successfully.", data:createdCategory})
        }
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

const getAllCategories = expressAsyncHandler( async (req,res,next) => {
    try {
        const categories = await Category.find({ isDeleted:false, deletedAt:null}).populate("createdBy","userName")
        return res.status(200).json({ status:"SUCCESS", message:"Categories listed successfully.", data:categories})
    } catch (error) {
       next(error) 
    }
});



module.exports = { createCategory,getAllCategories}
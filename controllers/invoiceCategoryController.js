const expressAsyncHandler = require("express-async-handler");
const InvoiceCategory = require("../models/InvoiceCategoryModel");
const logger = require("../utils/logger")
const _ = require("lodash");
const { descriptionFormater } = require("../utils/stringFormaters");



const createAnInvoiceCategory = expressAsyncHandler( async(req,res,next)=>{
    try {
        const {name,status,description} = req.body;
        if(!name || !status || !description){
            return res.status(400).json({ status:"FAILED", message:"Please provide all required fields...."})
        }

        const existingInvoiceCategory = await InvoiceCategory.findOne({ name:_.startCase(_.toLower(name))});
        if(existingInvoiceCategory){
            return res.status(409).json({ message:`Invoice category ${existingInvoiceCategory.name} already exist.`})
        }
        
        const createdInvoiceCategory = await InvoiceCategory.create({...req.body, createdBy:req.user._id, name:_.startCase(_.toLower(name)), description:descriptionFormater(description)});
        return res.status(201).json({ status:"SUCCESS", message:"Invoice category created successfully." , data:createdInvoiceCategory})
    } catch (error) {
        logger.error(error)
        next(error)
    }
})


module.exports ={ createAnInvoiceCategory }
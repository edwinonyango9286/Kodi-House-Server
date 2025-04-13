const expressAsyncHandler = require("express-async-handler");
const SupportTicket = require("../models/supportTicketModel");
const _ = require("lodash");
const  {descriptionFormater } = require("../utils/stringFormaters");
const { default: slugify } = require("slugify");
const validateMongoDbId = require("../utils/validateMongoDbId");

const createASupportTicket = expressAsyncHandler(async (req, res, next) => {
  try {
    const { name, status, description } = req.body;
    if(!name || !status || !description){
        return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
    }
    // const existingSupportTicket = await SupportTicket.findOne({
    //   name: _.startCase(_.toLower(name)),
    // });
    // if(existingSupportTicket){
    //     return res.status(409).json({ message: `Support ticket ${existingSupportTicket.name} already exist.`})
    // }
    const createdSupportTicket = await SupportTicket.create({ ...req.body, createdBy: req.user._id, name:_.startCase(_.toLower(name)), description: descriptionFormater(description), slug: slugify(name)})
    return res.status(201).json({ status:"SUCCESS", message:"Support ticket created successfully.", data:createdSupportTicket})
  } catch (error) {
    next(error);
  }
});


const updateASupportTicket = expressAsyncHandler( async(req,res,next)=>{
    try {
        const {supportTicketId} = req.params;
        validateMongoDbId(supportTicketId)
        const {name, description, status} = req.body;
        if(!name || !description || !status){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields."})
        }
        const updatedSupportTicket = await SupportTicket.findOneAndUpdate({ _id: supportTicketId, isDeleted:false,deletedAt: null}, { updatedBy: req.user._id, name:_.startCase(_.toLower(name)), description:descriptionFormater(description) }, { new:true, runValidators:true})
        if(!updatedSupportTicket){
            return res.status(404).json({ status:"SUCCESS", message:"Support ticket not found."})
        }
        return res.status(200).json({ status:"SUCCESS", message: "Support ticket updated successfully.", data: updatedSupportTicket})
        
    } catch (error) {
        next(error)
    }
})

const getASupportTicket = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {supportTicketId} = req.params
        validateMongoDbId(supportTicketId)
        const supportTicket = await SupportTicket.findOne({ _id:supportTicketId, isDeleted:false, deletedAt:null })
        return res.status(200).json({status:"SUCCESS", data: supportTicket }) 
    } catch (error) {
       next(error) 
    }
})

const getAllSupportTickets = expressAsyncHandler(async(req,res,next)=>{
    try {
        const queryObject = {...req.query};
        const excludeFields = ["sort", "page", "limit", "offset", "fields"];
        excludeFields.forEach((el)=> delete queryObject[el]);

        let query = SupportTicket.find({...queryObject, isDeleted:false}).populate({ path:"createdBy", select:"userName"}).populate({ path:"updatedBy" , select:"userName"})
        if(req.query.sort){
            const sortBy = req.query.sort.split(",").join(" ")
            query = query.sort(sortBy)
        }else{
            query = query.sort("-createdAt")
        }
        if(req.query.fields){
            const fields = req.query.fields.split(",").join(" ")
            query = query.select(fields)
        }else{
        query = query.select("-__v")
        }

        const limit = Math.min(parseInt(req.query.limit, 10) ||10, 100)
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
        query = query.skip(offset).limit(limit)

        const supportTickets = await query;
        const totalCount = await SupportTicket.countDocuments({ ...queryObject, isDeleted:false })
        const totalPages = Math.ceil(totalCount/limit)

        return res.status(200).json({ status:"SUCCESS", data:supportTickets, totalCount, totalPages, limit, offset})
    } catch (error) {
       next(error) 
    }
})


const deleteASupportTicket = expressAsyncHandler(async(req,res,next)=>{
    try {
        const {supportTicketId} = req.params
        const deletedSupportTicket = await SupportTicket.findOneAndUpdate({ _id: supportTicketId, isDeleted:false, deletedAt:null}, { isDeleted:true, deletedAt: Date.now()} ,{ new : true, runValidators:true})
        if(!deletedSupportTicket){
            return res.status(404).json({ status:"FAILED", message:"Support ticket not found."})
        }
        return res.status(200).json({ status:"SUCCESS", message:"Support ticket deleted successfully.",data:deletedSupportTicket})
    } catch (error) {
       next(error) 
    }
})

module.exports = {createASupportTicket, updateASupportTicket, deleteASupportTicket, getAllSupportTickets,getASupportTicket}

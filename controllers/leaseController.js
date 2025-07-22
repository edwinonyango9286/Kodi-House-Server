const expressAsyncHandler = require("express-async-handler");
const Joi = require("joi");
const Lease = require("../models/leaseModel");
const User = require("../models/userModel")

const createLease = expressAsyncHandler( async(req,res,next)=>{
    try {
     const createdLease = await Lease.create({...req.body, createdBy:req.user._id });
     return res.status(201).json({ status:"SUCCESS", message:"Lease created successfully.", data:createdLease})
    } catch (error) {
      next(error)
    }
});

const getAllLeases = expressAsyncHandler( async (req,res,next)=>{
    try {
        const userMakingRequest =  await  User.findOne({ _id:req.user._id}).populate("role","name");
        let query;
        if(userMakingRequest.role.name ==="Landlord"){
           query = await Lease.find({ createdBy:req.user._id, isDeleted:false, deletedAt:null }).populate("tenant", "userName");
        }else if( userMakingRequest.role.name === "Admin"){
          query = await Lease.find().populate("createdBy", "name");
        }
        const leases = await query
        totalCount = await Lease.countDocuments();
        return res.status(200).json({ status:"SUCCESS", message:"Leases listed successfully",data:leases, totalCount })
    } catch (error) {
      next(error)
    }
});

const updateALease =  expressAsyncHandler (async(req,res,next)=>{
    try {
        const updatedLease = await Lease.findOneAndUpdate({ _id:req.params.leaseId, createdBy:req.user._id })
        if(!updatedLease){
            return res.status(404).json({ status:"FAILED", message:"Lease not found" })
        }
     return res.status(200).json({ status:"SUCCESS", message:"Lease updated successfully.", data:updatedLease})
    } catch (error) {
      next(error)  
    }
})






module.exports ={ createLease, getAllLeases, updateALease }

const expressAsyncHandler = require("express-async-handler")
const  logger = ("../utils/logger")
const  Transaction = require("../models/transactionModel")

const createATransaction = expressAsyncHandler( async(req,res,next) => {
    try {
        const {transactionName, amount, transactionId , status}  = req.body
        if(!transactionName || !amount || !transactionId || !status){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields." })
        }
        const createdTransaction = await Transaction.create({...req.body, transactionDate:Date.now(),transactionBy:req.user._id});
        return res.status(201).json({ status:"SUCCESS", message:"Transaction successfylly" })

    } catch (error) {
        logger.error(error)
        next(error)
    }
})

const listAllTransactions =  expressAsyncHandler( async (req,res,next)=>{
    try {
        // lists transactions that haven't been deleted
        const allTransactions = await Transaction.find({ isDeleted:false, deletedAt:null}).populate("transactionBy", "userName")
        return res.status(200).json({ status:"SUCCESS", message:"Transactions listed successfully.", data:allTransactions})
        
    } catch (error) {
        logger.error(error);
        next(error)
    }

})

module.exports = {createATransaction, listAllTransactions}
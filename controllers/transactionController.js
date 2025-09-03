
const expressAsyncHandler = require("express-async-handler")
const logger = ("../utils/logger")
const Transaction = require("../models/transactionModel")
const User = require("../models/userModel")

const createATransaction = expressAsyncHandler( async(req,res,next) => {
    try {
        const userId = req.user._id;
        console.log(userId,"userId");
        const {transactionName, amount, transactionId , status}  = req.body
        if(!transactionName || !amount || !transactionId || !status){
            return res.status(400).json({ status:"FAILED", message:"Please provide all the required fields." })
        }
        const createdTransaction = await Transaction.create({...req.body, transactionDate:Date.now(), transactionBy:req.user._id});
        return res.status(201).json({ status:"SUCCESS", message:"Transaction successfully", data:createdTransaction })

    } catch (error) {
        logger.error(error.message);
        next(error)
    }
})

// Not cool to delete any transaction
// Let all transactions be saved in the database.
const listAllTransactions =  expressAsyncHandler( async (req,res,next)=>{
    try {
        const queryObject = {...req.query };
        const excludedFields = ["page","sort","limit","offset","search"];
        excludedFields.forEach((el)=>delete queryObject[el]);
        // let baseQuery = JSON.parse(queryObject);
        if(req.query.search){
            const searchRegex = new RegExp(req.query.search,"i");
            queryObject.$or =[
                {transactionName:searchRegex },
                {transactionId :searchRegex },
                {status:searchRegex}
            ]
        }

        const userFetchingTransactions =  await User.findById(req.user._id).populate({ path:"role", select:"_id name" });
        if(!userFetchingTransactions){
            return res.status(404).json({ message:"User not found."});
        }

        let roleCondition ={};
        // Admin role fetch all transactions
        if(userFetchingTransactions.role.name ==="Admin"){
            roleCondition = { }
        }else if (userFetchingTransactions.role.name ==="Landlord"){
            roleCondition = { isDeleted:false }
        }else if(userFetchingTransactions === "Tenant"){
            roleCondition = { transactionBy:req.user._id, isDeleted:false }
        }

        const finalQuery = {...queryObject, ...roleCondition };
        let query = Transaction.find(finalQuery);
        let countQuery = Transaction.find(finalQuery)
        if (userFetchingTransactions.role.name === "Admin") {
            query = query.populate({ path: "transactionBy", select: "userName" });
        } else if (userFetchingTransactions.role.name === "Landlord") {
            query = query.populate("currentOccupant", "firstName secondName");
        } else if (userFetchingTransactions === "Tenant") {
            query = query
        }

        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort({ createdAt: -1 });
        }

         if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

         query = query.skip(skip).limit(limit);
         const [transactions, totalCount] = await Promise.all([query.exec(), countQuery.countDocuments()]);
         const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({ 
            status:"SUCCESS", 
            message:"Transactions listed successfully.", 
            data:transactions,
            totalCount,
            totalPages, 
            currentPage:page,
            limit
        })
        
    } catch (error) {
        // logger.error(error.message);
        next(error)
    }

})

module.exports = {createATransaction, listAllTransactions}
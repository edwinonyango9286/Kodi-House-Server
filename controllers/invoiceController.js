const expressAsyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const logger = require("../utils/logger")
const User = require("../models/userModel.js")

// generate a random string for invoice number
const generateARandomString = (stringLength) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < stringLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

const generateInvoiceNumber = () => {
  const prefix = "INV-";
  const randomPart = generateARandomString(6);
  return `${prefix}${randomPart}`;
};

const createInvoice = expressAsyncHandler(async (req, res,next) => {
  try {
    const { tag, invoiceCategory, description, allowedMethodOfPayment, recurringStatus, amount, tenant, property, dueDate , status } = req.body;
    // check for required fields
    if ( !tag || !description || !invoiceCategory ||  !allowedMethodOfPayment ||   !recurringStatus || !amount ||  !property ||  !tenant ||   !dueDate || !status ) {
      return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields..." });
    }
    const createdInvoice = await Invoice.create({ ...req.body, createdBy: req.user._id, invoiceNumber: generateInvoiceNumber() });
    return res.status(201).json({ status: "SUCCESS", message: "Invoice created successfully.", data: createdInvoice});

  } catch (error) {
    logger.error(error)
    next(error)
  }
});



const updateAnInvoice = expressAsyncHandler(async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    validateMongoDbId(invoiceId);
    // invoice number should not be updated so delete it from the request object
    const fieldsToUpdate = { ...req.body };
    delete fieldsToUpdate.invoiceNumber;

    const updatedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: invoiceId,
        landlord: req.landlord._id,
      },
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    if (!updatedInvoice) {
      return res
        .status(400)
        .json({ status: "FAILED", message: "Invoice not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Invoice updated successfully.",
      data: updatedInvoice,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

const getAllInvoices = expressAsyncHandler(async (req, res, next) => {
  try {
  const queryObject = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields","search"];
  excludeFields.forEach((element) => delete queryObject[element]);

  let queryString = JSON.stringify(queryObject);
  queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  const userMakingRequest = await User.findOne({ _id:req.user._id}).populate("role","name");
  let query;
  let baseQuery = JSON.parse(queryString)

  if(req.query.search){
    const searchRegex = new RegExp(req.query.search,"i");
    baseQuery.$or =[
      {invoiceNumber:searchRegex},
      {invoiceCategory:searchRegex},
      {status:searchRegex}
     ]
  }
  if( userMakingRequest && userMakingRequest.role.name === "Admin"){
    query = Invoice.find({...baseQuery, isDeleted: false, deletedAt: null}).populate({path:"createdBy", select:"userName"}).populate({ path: "tenant", select: "firstName secondName" }).populate({ path: "property", select: "name" }).populate({ path: "unit", select: "unitNumber" });
  }else {
    query = Invoice.find({...baseQuery, isDeleted: false, deletedAt: null, createdBy:req.user._id}).populate({ path: "tenant", select: "firstName secondName" }).populate({ path: "property", select: "name" }).populate({ path: "unit", select: "unitNumber" });
  }
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }
  if (req.query.fields) { 
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page-1) * limit
  query = query.skip(skip).limit(limit);

  const invoices = await query;
  const totalCount = await Invoice.countDocuments(query.getFilter());
  const totalPages = Math.ceil(totalCount/limit);
  return res.status(200).json({ 
    status: "SUCCESS", 
    data: invoices , 
    totalCount, 
    totalPages, 
    limit, 
    currentPage:page
  });

   } catch (error) {
    logger.error(error)
    next(error)
  }
});



const deleteAnInvoice = expressAsyncHandler(async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    validateMongoDbId(invoiceId);
    const deletedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: invoiceId,
        landlord: req.landlord._id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!deletedInvoice) {return res
        .status(404)
        .json({ status: "FAILED", message: "Invoice not found." });
    }
    return res.status(200).json({ status: "SUCCESS", message: "Invoice deleted successfully.", data: deletedInvoice });
  } catch (error) {
    logger.error(error)
    next(error)
  }
});

const updateInvoiceStatus = expressAsyncHandler(async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;
    const updatedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: invoiceId,
        landlord: req.landlord._id,
        isDeleted: false,
        deletedAt: null,
      },
      { status: status },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return res
        .status(200)
        .message({ status: "FAILED", message: "Invoice not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Invoice updated successfully.",
      data: updatedInvoice,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAllInvoices,
  createInvoice,
  deleteAnInvoice,
  updateAnInvoice,
  updateInvoiceStatus,
};

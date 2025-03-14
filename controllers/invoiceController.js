const expressAsyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { Logger } = require("winston");

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

const createInvoice = expressAsyncHandler(async (req, res) => {
  try {
    const {
      description,
      allowedMethodOfPayment,
      tags,
      recurringInvoice,
      amount,
      tenant,
      property,
      unit,
      dueDate,
    } = req.body;

    // check for required fields
    if (
      !description ||
      !allowedMethodOfPayment ||
      !tags ||
      !recurringInvoice ||
      !amount ||
      !property ||
      !tenant ||
      !unit ||
      !dueDate
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please provide all the required fields.",
      });
    }
    const createdInvoice = await Invoice.create({
      ...req.body,
      landlord: req.landlord._id,
      invoiceNumber: generateInvoiceNumber(),
    });

    return res.status(201).json({
      status: "SUCCESS",
      message: "Invoice created successfully.",
      data: createdInvoice,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
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
    Logger.error(error);
    next(error);
  }
});

// all invoices excluding deleted invoices => specific to a particular landlord
const getAllInvoices = expressAsyncHandler(async (req, res) => {
  const queryObject = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "offset", "fields"];
  excludeFields.forEach((element) => delete queryObject[element]);

  let queryString = JSON.stringify(queryObject);
  queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );

  let query = Invoice.find({
    ...JSON.parse(queryString),
    isDeleted: false,
    deletedAt: null,
    landlord: req.landlord._id,
  }) //populate fields
    .populate({ path: "tenant", select: "firstName secondName" })
    .populate({ path: "property", select: "name" })
    .populate({ path: "unit", select: "unitNumber" });

  // sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }
  // field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }
  // pagination
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  query = query.skip(offset).limit(limit);

  const invoices = await query;
  return res.status(200).json({ status: "SUCCESS", data: invoices });
});

const deleteAnInvoice = expressAsyncHandler(async (req, res) => {
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

    if (!deletedInvoice) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Invoice not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Invoice deleted successfully.",
      data: deletedInvoice,
    });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  getAllInvoices,
  createInvoice,
  deleteAnInvoice,
  updateAnInvoice,
};

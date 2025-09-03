const Joi = require("joi");

const createReceiptSchema = Joi.object({
  createdBy: Joi.string(),
  updateBy: Joi.string(),
  invoice: Joi.string().required(),
  tenant: Joi.string().required(),
  property: Joi.string().required(),
  unit: Joi.string(),
  transactionId: Joi.string().required(),
  description: Joi.string().required(),
  amount: Joi.number().required(),
  attachment: Joi.object({
    secure_url: Joi.string().required(),
    public_id: Joi.string().required(),
  }).required(),
  paymentMode: Joi.string().required(),
  isDeleted: Joi.boolean(),
  deletedAt: Joi.date().greater("now"),
  deletedBy: Joi.string(),
});

module.exports = {createReceiptSchema }

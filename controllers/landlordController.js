const Landlord = require("../models/landlordModel");
const expressAsyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");

// get landlord profile
const me = expressAsyncHandler(async (req, res, next) => {
  try {
    const me = await Landlord.findById({ _id: req.landlord._id });
    if (!me) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "User not found." });
    }

    return res.status(200).json({ status: "SUCCESS", data: me });
  } catch (error) {
    next(error);
  }
});

// landlord update own account details
const updateLandlordProfileLandlord = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const {
        firstName,
        secondName,
        email,
        businessName,
        idNumber,
        lastName,
        address,
        phoneNumber,
      } = req.body;

      // validate required fields
      if (
        !firstName ||
        !secondName ||
        !email ||
        !phoneNumber ||
        !businessName ||
        !idNumber ||
        !address
      ) {
        return res.status(400).json({
          status: "FAILED",
          message: "Please provide all the required fields.",
        });
      }
      validatePhoneNumber(phoneNumber);
      if (!emailValidator.validate(email)) {
        return res.status(400).json({
          status: "SUCCESS",
          message: "Please provide a valid email address.",
        });
      }
      const updatedLandlord = await Landlord.findOneAndUpdate(
        {
          _id: req.landlord._id,
        },
        {
          ...req.body,
          firstName: _.startCase(_.toLower(firstName)),
          secondName: _.startCase(_.toLower(secondName)),
          lastName: _.startCase(_.toLower(lastName)),
          businessName: _.startCase(_.toLower(businessName)),
        },
        { new: true, runValidators: true }
      );
      if (!updatedLandlord) {
        return res
          .status(404)
          .json({ status: "FAILED", message: "User not found." });
      }
      return res.status(200).json({
        status: "SUCCESS",
        message: "Profile updated successfully.",
        data: updatedLandlord,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);

module.exports = {
  me,
  updateLandlordProfileLandlord,
};

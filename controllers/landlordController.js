const Landlord = require("../models/landlordModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");

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

module.exports = {
  me,
};

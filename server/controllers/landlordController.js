const Landlord = require("../models/landlordModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");

// get landlord with all related data => tenants, properties, etc.

const getALandlordWithAllRelatedData = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.landlord;
    validateMongoDbId(_id);
    // landlord to be populated when data is available
    const landlord = await Landlord.findById({ _id: _id });
    // .populate("users")
    // .populate("properties")
    // .populate("tenants")
    // .populate("applications")
    // .populate("invoices");
    if (!landlord) {
      return res
        .status(404)
        .json({ status: "FAILED", message: "Landlord not found." });
    }

    // removes refresh token from the landlord
    const { refreshToken, ...landlordWithoutRefreshToken } =
      landlord.toObject();
    return res
      .status(200)
      .json({ status: "SUCCESS", landlord: landlordWithoutRefreshToken });
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
});

module.exports = {
  getALandlordWithAllRelatedData,
};



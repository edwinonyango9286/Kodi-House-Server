const Landlord = require("../models/landlordModel");

// It's the work of the admin to verify a particular landlord though the landlord is not related to the admin
// for a landlord to start using his/her account the landlord should be verified
const verifyLandlordAccount = asyncHandler(async (req, res) => {
  try {
    const { landlordId } = req.params;
    validateMongoDbId(landlordId);
    const verifiedLandlord = await Landlord.findOneAndUpdate(
      {
        _id: landlordId,
      },
      {
        isAccountVerrified: true,
      }
    );
    if (!verifiedLandlord) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Landlord not found." });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "Landlord account activated successfully.",
      data: verifiedLandlord,
    });
  } catch (error) {
    logger.error({ message: error.message });
    return res.status(500).json({ message: error.message });
  }
});

module.exports = { verifyLandlordAccount };

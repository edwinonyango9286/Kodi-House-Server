const mongoose = require("mongoose");

const validateMongoDbId = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) {
    return { status: "Failed", message: "Invalid mongodb Id." };
  }
};

module.exports = validateMongoDbId;

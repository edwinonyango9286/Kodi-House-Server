const mongoose = require("mongoose");

const validateMongoDbId = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) {
    throw new Error(`${id} is not a valid ObjectId.`);
  }
  return true; 
};


module.exports = validateMongoDbId;

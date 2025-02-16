const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MongodbURI, {
    });
    console.log("Database connected successfully.");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = dbConnection;

const jwt = require("jsonwebtoken");

const generateAccessToken = (id) => {
  try {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
  } catch (error) {
    return { status: "FAILED", message: error.message };
  }
};

module.exports = { generateAccessToken };

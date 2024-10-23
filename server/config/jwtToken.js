const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  try {
    return jwt.sign({ id }, process.env.JWT_SECRETE, { expiresIn: "1d" });
  } catch (error) {
    throw new Error("Something went wrong. Please try again later.");
  }
};

module.exports = { generateToken };

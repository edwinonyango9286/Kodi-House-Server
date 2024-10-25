const jwt = require("jsonwebtoken");

const generateAccessToken = (id) => {
  try {
    return jwt.sign(
      { id, iat: Math.floor(Date.now() / 1000) },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "2m",
      }
    );
  } catch (error) {
    throw new Error("Something went wrong. Please try again later.");
  }
};

module.exports = { generateAccessToken };

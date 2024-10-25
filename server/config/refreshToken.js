const jwt = require("jsonwebtoken");

const generateRefreshToken = (id) => {
  try {
    return jwt.sign(
      { id, iat: Math.floor(Date.now() / 1000) },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "40m",
      }
    );
  } catch (error) {
    throw new Error("Something went wrong. Please try again later.");
  }
};

module.exports = { generateRefreshToken };

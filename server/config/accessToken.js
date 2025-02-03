const jwt = require("jsonwebtoken");

const generateAccessToken = (id, tokenVersion) => {
  try {
    return jwt.sign(
      { id, tokenVersion, iat: Math.floor(Date.now() / 1000) },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "2m",
      }
    );
  } catch (error) {
    return { status: "FAILED", message: "Access token generation failed." };
  }
};

module.exports = { generateAccessToken };

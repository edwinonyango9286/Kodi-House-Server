const jwt = require("jsonwebtoken");

const generateRefreshToken = (id) => {
  try {
    return jwt.sign(
      { id, iat: Math.floor(Date.now() / 1000) },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );
  } catch (error) {
    return { status: "FAILED", message: "Refresh token generation failed." };
  }
};

module.exports = { generateRefreshToken };

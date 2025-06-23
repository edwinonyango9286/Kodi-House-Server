const mongoose = require("mongoose");

const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandlerMiddleware = (err, req, res, next) => {
  // handles  validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ status: "FAILED", message: Object.values(err.errors).map((e) => e.message).join(", "), stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }

  // handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({ status: "FAILED", message: `The ${field} "${value}" already exists. Please use a different ${field}.`, stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }

  // handle cast errors eg. invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({  status: "FAILED",  message: `Invalid value for ${err.path}: ${err.value}. Please provide a valid value.`, stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }

  // Handle other errors
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
   res.status(statusCode).json({ status: "FAILED", message: err.message || "Internal Server Error", stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandlerMiddleware };

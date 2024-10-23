const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    status: false,
    message: err?.message,
    stack: err?.stack,
  });
};

module.exports = { notFound, errorHandlerMiddleware };

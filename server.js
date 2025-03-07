const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

// checks if excel uploads directory exist if not creates one => this is done when the server starts
const uploadsDir = path.join(__dirname, "excelUploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});

app.use(limiter);


// Express proxy will be necessary if we need to migrate to microservice
// Actually is not needed for a monolithic architecture

// //proxy configuration=> only works for a microservice architecture
// const apiProxy = createProxyMiddleware("/api/v1", {
//   target: "http://localhost:4000",
//   changeOrigin: true,
//   pathRewrite: {
//     "^/api/v1": "",
//   },
//   onError: (err, req, res) => {
//     return res.status(500).json({
//       status: "FAILED",
//       message: "Something went wrong with the proxy.",
//     });
//   },
// });
// app.use(apiProxy);

const PORT = process.env.PORT || 4000;
const dbConnection = require("./config/dbConnection");

const {
  notFound,
  errorHandlerMiddleware,
} = require("./middlewares/errorHandlerMiddelware");

app.use(notFound);
app.use(errorHandlerMiddleware);

dbConnection();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

// checks if excel uploads directory exist if not creates one => this is done when the app starts
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

// //proxy configuration=> only works for a microservice architecture
// const apiProxy = createProxyMiddleware("/api/v1", {
//   target: "http://localhost:5000",
//   changeOrigin: true,
//   pathRewrite: {
//     "^/api/v1": "",
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

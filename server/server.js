const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");

// checks if excel uploads directory exist if not creates one => this is done when the app starts
const uploadsDir = path.join(__dirname, "excelUploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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

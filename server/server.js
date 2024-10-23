const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 4000;
const connect = require("./config/databaseConnection");

const {
  notFound,
  errorHandlerMiddleware,
} = require("./middlewares/errorHandlerMiddelware");

app.use(notFound);
app.use(errorHandlerMiddleware);

connect();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

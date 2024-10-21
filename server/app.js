const express = require("express");
const app = express({ limit: "50mb" });
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const origins = [
  process.env.ORIGIN_LOCALHOST_3000,
  process.env.ORIGIN_LOCALHOST_3001,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, { origin: origin, optionsSuccessStatus: 200 });
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

const authRouter = require("./routes/authRoutes");
app.use("/api/auth", authRouter);

module.exports = app;

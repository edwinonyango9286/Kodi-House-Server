const express = require("express");
const app = express();
const session = require("express-session");
const dotenv = require("dotenv");
dotenv.config();
const passport = require("passport");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

// routers
const landlordAuthRouter = require("./routes/landlordAuthRoutes");
const tenantAuthRouter = require("./routes/tenantAuthRoutes");
const applicationRouter = require("./routes/applicationRoutes");
const roleRouter = require("./routes/roleRoutes");
const landlordRouter = require("./routes/landlordRoutes")

app.use(express.json({ limit: "50mb" }));

const origins = [
  process.env.ORIGIN_LOCALHOST_3000,
  process.env.ORIGIN_LOCALHOST_3001,
  process.env.KODI_HOUSE_LANDLORDAPP_PRODUCTION_URL,
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

app.use(
  session({
    secret: process.env.SESSION_SECERET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, //should be set to true if you are using https for example in production.
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/v1/landlord/auth", landlordAuthRouter);
app.use("/api/v1/tenant/auth", tenantAuthRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/role", roleRouter);
app.use("/api/v1/landlord", landlordRouter)

module.exports = app;

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

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// swagger definition

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.1.0",
    info: {
      title: "Kodi House",
      version: "1.0.0",
      description: "Api documentation for Kodi House",
    },
    server: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
      },
    ],
  },
  apis: ["./routes/*js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// routers
const applicationRouter = require("./routes/applicationRoutes");
const roleRouter = require("./routes/roleRoutes");
const userRouter = require("./routes/userRoutes");
const tenantRouter = require("./routes/tenantRoute");
const propertyRouter = require("./routes/propertyRoute");
const authRouter = require("./routes/authRoutes");
const invoiceRouter = require("./routes/invoiceRoutes");
const unitRouter = require("./routes/unitRoute");
const propertyCategoryRouter = require("./routes/propertyCategoryRoutes");
const unitCategoryRouter = require("./routes/unitCategoryRoute");
const permissionRouter = require("./routes/permissionRoutes");
const propertyTypeRouter = require("./routes/propertyTypeRoutes");
const propertyTagRouter = require("./routes/propertyTagRoutes");
const supportTicketRouter = require("./routes/supportTicketRoutes");
const transactionRouter = require("./routes/transactionRoutes")
const categoriesRouter = require("./routes/categoryRoutes")
const tagRouter = require("./routes/tagRoutes")
const invoiceCategoryRouter = require("./routes/invoiceCategoryRoutes")
const imageUploadRouter = require("./routes/imageUploadRoutes")

app.use(express.json({ limit: "50mb" }));

const origins = [
  process.env.ORIGIN_LOCALHOST_5173,  
  process.env.ORIGIN_LOCALHOST_3001,
  process.env.ORIGIN_LOCALHOST_4000,
  process.env.ORIGIN_LOCALHOST_ADMIN,
  process.env.KODI_HOUSE_LANDLORDAPP_PROD_URL,
  process.env.KODI_HOUSE_ADMIN_DEV_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (origins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/tenants", tenantRouter);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/units", unitRouter);
app.use("/api/v1/property-categories", propertyCategoryRouter);
app.use("/api/v1/unit-categories", unitCategoryRouter);
app.use("/api/v1/permissions", permissionRouter);
app.use("/api/v1/property-types", propertyTypeRouter);
app.use("/api/v1/property-tags", propertyTagRouter);
app.use("/api/v1/support-tickets", supportTicketRouter);
app.use("/api/v1/transaction",transactionRouter )
app.use("/api/v1/categories",categoriesRouter)
app.use("/api/v1/tags",tagRouter)
app.use("/api/v1/invoice-categories", invoiceCategoryRouter)
app.use("/api/v1/upload-images", imageUploadRouter)

module.exports = app;

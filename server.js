// const cluster = require("cluster");
// const os = require("os");

// if (cluster.isPrimary) {
//   const numCPUs = os.cpus().length;
//   console.log(`Primary process ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died. Spawning a new one.`);
//     cluster.fork();
//   });
// } else {
//   const app = require("./app");
//   const dotenv = require("dotenv");
//   dotenv.config();
//   const fs = require("fs");
//   const path = require("path");
//   const rateLimit = require("express-rate-limit");
//   const { createClient } = require("redis");

//   const { RedisStore } = require("rate-limit-redis");

//   (async () => {
//     const redisClient = createClient({
//       url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
//       socket: {
//         reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
//       },
//     });

//     redisClient.on("error", (err) => {
//       console.error("Redis Client Error", err);
//     });

//     await redisClient.connect();

//     const uploadsDir = path.join(__dirname, "excelUploads");
//     if (!fs.existsSync(uploadsDir)) {
//       fs.mkdirSync(uploadsDir);
//     }

//     let store;
//     try {
//       store = new RedisStore({
//         sendCommand: (...args) => redisClient.sendCommand(args),
//       });
//     } catch (err) {
//       console.error("Redis store failed, falling back to memory");
//       store = new rateLimit.MemoryStore();
//     }

//     const limiter = rateLimit({
//       store,
//       windowMs: 15 * 60 * 1000,
//       max: 100,
//       message: "Too many requests from this IP, please try again later.",
//       headers: true,
//     });

//     app.use(limiter);

//     const PORT = process.env.PORT || 4000;
//     const dbConnection = require("./config/dbConnection");
//     const {
//       notFound,
//       errorHandlerMiddleware,
//     } = require("./middlewares/errorHandlerMiddelware");

//     app.use(notFound);
//     app.use(errorHandlerMiddleware);

//     dbConnection();
//     app.listen(PORT, () => {
//       console.log(`Worker ${process.pid} is running on port ${PORT}`);
//     });
//   })();
// }

const app = require("./app");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
const { RedisStore } = require("rate-limit-redis");

(async () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  await redisClient.connect();

  const uploadsDir = path.join(__dirname, "excelUploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  let store;
  try {
    store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  } catch (err) {
    console.error("Redis store failed, falling back to memory");
    store = new rateLimit.MemoryStore();
  }

  const limiter = rateLimit({
    store,
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    headers: true,
  });

  app.use(limiter);

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
})();

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
  },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

( async () => {
  try {
    await redisClient.connect();
    const pong =  await redisClient.ping();
    if(pong === "PONG"){
      console.log("✅ Redis connection verified.");
    }
  } catch (error) {
    console.log("❌ Redis connection failed:", err.message);
  }
})();


module.exports = redisClient;
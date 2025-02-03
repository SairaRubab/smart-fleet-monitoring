const redis = require("redis");

const redisClient = redis.createClient({
    socket: {
        host: "localhost",
        port: 6379
    }
});

redisClient.connect();
redisClient.on("connect", () => console.log("✅ Connected to Redis"));
redisClient.on("error", (err) => console.error("❌ Redis connection error:", err));

module.exports = redisClient;

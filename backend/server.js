require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mysql = require("mysql2/promise");
const redis = require("redis");
const { connect } = require("nats");

// Initialize Express App
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ✅ Connect to MySQL Database
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "password",
    database: process.env.DB_NAME || "fleet_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ Connect to Redis for Caching
const redisClient = redis.createClient({
    socket: {
        host: "localhost",
        port: 6379
    }
});

redisClient.connect();
redisClient.on("connect", () => {
    console.log("✅ Connected to Redis");
});
redisClient.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

// ✅ Connect to NATS Messaging
async function connectNATS() {
    const nc = await connect({ servers: "nats://demo.nats.io:4222" });

    console.log("✅ Connected to NATS");

    nc.subscribe("fleet-updates", (msg) => {
        console.log("🔔 Received Fleet Update:", msg.data.toString());
    });

    return nc;
}
const natsConnection = connectNATS();

// ✅ Fleet API Routes

// 🏎️ Get All Vehicles (with Redis Caching)
app.get("/vehicles", async (req, res) => {
    try {
        const cacheData = await redisClient.get("vehicles");
        if (cacheData) {
            console.log("⚡ Cache Hit");
            return res.json(JSON.parse(cacheData));
        }

        console.log("⏳ Cache Miss");
        const [rows] = await pool.query("SELECT * FROM vehicles");
        await redisClient.set("vehicles", JSON.stringify(rows), { EX: 60 }); // Cache for 60 sec
        res.json(rows);
    } catch (error) {
        console.error("❌ Error Fetching Vehicles:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 🚗 Add a New Vehicle
app.post("/vehicles", async (req, res) => {
    try {
        const { name, status, location } = req.body;
        if (!name) return res.status(400).json({ error: "Vehicle name is required" });

        const [result] = await pool.query(
            "INSERT INTO vehicles (name, status, location) VALUES (?, ?, ?)",
            [name, status || "idle", location || null]
        );

        await redisClient.del("vehicles"); // Clear cache after insert

        // Publish to NATS
        const nc = await natsConnection;
        nc.publish("fleet-updates", `New vehicle added: ${name}`);

        res.status(201).json({ message: "Vehicle added", id: result.insertId });
    } catch (error) {
        console.error("❌ Error Adding Vehicle:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// ⚡ Update Vehicle Status
app.put("/vehicles/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, location } = req.body;

        const [result] = await pool.query(
            "UPDATE vehicles SET status = ?, location = ? WHERE id = ?",
            [status, location, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await redisClient.del("vehicles"); // Clear cache after update

        // Publish to NATS
        const nc = await natsConnection;
        nc.publish("fleet-updates", `Vehicle ${id} status updated to ${status}`);

        res.json({ message: "Vehicle updated" });
    } catch (error) {
        console.error("❌ Error Updating Vehicle:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 🚀 Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

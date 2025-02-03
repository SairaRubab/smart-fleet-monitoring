const pool = require("../config/db");
const redisClient = require("../config/redis");
const natsConnection = require("../config/nats");

// 🏎️ Fetch All Vehicles (with Redis Caching)
const getVehicles = async (req, res) => {
    try {
        const cacheData = await redisClient.get("vehicles");
        if (cacheData) {
            console.log("⚡ Cache Hit");
            return res.json(JSON.parse(cacheData));
        }

        console.log("⏳ Cache Miss");
        const [rows] = await pool.query("SELECT * FROM vehicles");

        await redisClient.set("vehicles", JSON.stringify(rows), { EX: 60 });
        res.json(rows);
    } catch (error) {
        console.error("❌ Error Fetching Vehicles:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// 🚗 Add a New Vehicle
const addVehicle = async (req, res) => {
    try {
        const { name, status, location } = req.body;
        if (!name) return res.status(400).json({ error: "Vehicle name is required" });

        const [result] = await pool.query(
            "INSERT INTO vehicles (name, status, location) VALUES (?, ?, ?)",
            [name, status || "idle", location || null]
        );

        await redisClient.del("vehicles");

        const nc = await natsConnection;
        nc.publish("fleet-updates", `New vehicle added: ${name}`);

        res.status(201).json({ message: "Vehicle added", id: result.insertId });
    } catch (error) {
        console.error("❌ Error Adding Vehicle:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// ⚡ Update Vehicle Status
const updateVehicle = async (req, res) => {
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

        await redisClient.del("vehicles");

        const nc = await natsConnection;
        nc.publish("fleet-updates", `Vehicle ${id} status updated to ${status}`);

        res.json({ message: "Vehicle updated" });
    } catch (error) {
        console.error("❌ Error Updating Vehicle:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// ❌ Delete a Vehicle
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query("DELETE FROM vehicles WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await redisClient.del("vehicles");

        const nc = await natsConnection;
        nc.publish("fleet-updates", `Vehicle ${id} was removed`);

        res.json({ message: "Vehicle deleted" });
    } catch (error) {
        console.error("❌ Error Deleting Vehicle:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { getVehicles, addVehicle, updateVehicle, deleteVehicle };

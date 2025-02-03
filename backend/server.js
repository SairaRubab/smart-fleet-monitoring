require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

const vehicleRoutes = require("./routes/vehicles");
const gpsRoutes = require("./routes/gps");

const redisClient = require("./config/redis");
const esClient = require("./config/elasticsearch");
const natsConnection = require("./config/nats");

// ✅ Initialize Express App
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ✅ Set Up WebSockets
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ✅ Use Routes
app.use("/vehicles", vehicleRoutes);
app.use("/gps", gpsRoutes);

// ✅ WebSocket Connection for Live GPS Tracking
io.on("connection", (socket) => {
    console.log("✅ Client connected for live tracking");

    // Listen for GPS updates from NATS and send them to frontend
    natsConnection.subscribe("gps-updates", (msg) => {
        const gpsData = JSON.parse(msg.data.toString());
        io.emit("gps-update", gpsData);
    });

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected");
    });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


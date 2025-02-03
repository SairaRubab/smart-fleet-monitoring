const { connect } = require("nats");
const esClient = require("./elasticsearch");

async function connectNATS() {
    const nc = await connect({ servers: "nats://demo.nats.io:4222" });

    console.log("✅ Connected to NATS");

    nc.subscribe("fleet-updates", (msg) => {
        console.log("🔔 Fleet Update:", msg.data.toString());
    });

    nc.subscribe("gps-updates", async (msg) => {
        const gpsData = JSON.parse(msg.data.toString());

        console.log("📍 GPS Update Received:", gpsData);

        // Store GPS data in Elasticsearch
        await esClient.index({
            index: "gps_logs",
            body: gpsData
        });

        console.log("✅ GPS Data Stored in Elasticsearch");
    });

    return nc;
}

module.exports = connectNATS();

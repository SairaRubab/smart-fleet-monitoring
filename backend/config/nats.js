const { connect } = require("nats");

async function connectNATS() {
    const nc = await connect({ servers: "nats://demo.nats.io:4222" });
    console.log("✅ Connected to NATS");

    nc.subscribe("fleet-updates", (msg) => {
        console.log("🔔 Received Fleet Update:", msg.data.toString());
    });

    return nc;
}

module.exports = connectNATS();

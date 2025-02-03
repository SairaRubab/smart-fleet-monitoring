const { connect } = require("nats");

async function startGPSSimulation() {
    const nc = await connect({ servers: "nats://demo.nats.io:4222" });

    function getRandomLocation() {
        return {
            lat: (Math.random() * 180 - 90).toFixed(6),
            lon: (Math.random() * 360 - 180).toFixed(6)
        };
    }

    function sendGPSData(vehicleId) {
        const location = getRandomLocation();
        const message = {
            vehicleId,
            location,
            timestamp: new Date().toISOString()
        };

        console.log(`📡 Sending GPS data for Vehicle ${vehicleId}:`, message);
        nc.publish("gps-updates", JSON.stringify(message));
    }

    setInterval(() => {
        const randomVehicleId = Math.floor(Math.random() * 10) + 1;
        sendGPSData(randomVehicleId);
    }, 5000);
}

startGPSSimulation();


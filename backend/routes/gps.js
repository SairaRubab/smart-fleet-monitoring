const express = require("express");
const esClient = require("../config/elasticsearch");

const router = express.Router();

router.get("/:vehicleId", async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const { hits } = await esClient.search({
            index: "gps_logs",
            query: {
                match: { vehicleId }
            }
        });

        res.json(hits.hits.map(hit => hit._source));
    } catch (error) {
        console.error("❌ Error Fetching GPS Data:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;

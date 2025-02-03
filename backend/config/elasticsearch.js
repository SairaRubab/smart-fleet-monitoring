const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
    node: "http://localhost:9200"
});

async function checkElasticsearch() {
    try {
        const health = await esClient.cluster.health();
        console.log("✅ Elasticsearch is ready:", health);
    } catch (error) {
        console.error("❌ Elasticsearch connection failed:", error);
    }
}

checkElasticsearch();

module.exports = esClient;

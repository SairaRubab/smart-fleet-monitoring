const express = require("express");
const {
    getVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
} = require("../controllers/vehiclesController");

const router = express.Router();

// 🏎️ Fetch all vehicles (GET /vehicles)
router.get("/", getVehicles);

// 🚗 Add a new vehicle (POST /vehicles)
router.post("/", addVehicle);

// ⚡ Update vehicle details (PUT /vehicles/:id)
router.put("/:id", updateVehicle);

// ❌ Delete a vehicle (DELETE /vehicles/:id)
router.delete("/:id", deleteVehicle);

module.exports = router;

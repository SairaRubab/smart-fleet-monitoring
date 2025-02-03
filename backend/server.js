require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const vehicleRoutes = require("./routes/vehicles");

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/vehicles", vehicleRoutes);
const gpsRoutes = require("./routes/gps");
app.use("/gps", gpsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

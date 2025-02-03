import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Connect to backend

function MapComponent() {
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        // Fetch vehicles from backend
        axios.get("http://localhost:5000/vehicles")
            .then(response => setVehicles(response.data))
            .catch(error => console.error("❌ Error fetching vehicles:", error));

        // Listen for live GPS updates
        socket.on("gps-update", (data) => {
            setVehicles(prevVehicles =>
                prevVehicles.map(vehicle =>
                    vehicle.id === data.vehicleId ? { ...vehicle, location: data.location } : vehicle
                )
            );
        });

        return () => socket.off("gps-update"); // Cleanup socket connection
    }, []);

    return (
        <MapContainer center={[37.7749, -122.4194]} zoom={5} style={{ height: "100vh", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicles.map(vehicle => (
                <Marker key={vehicle.id} position={[vehicle.location.lat, vehicle.location.lon]}>
                    <Popup>
                        <strong>{vehicle.name}</strong> <br />
                        Status: {vehicle.status} <br />
                        Location: {vehicle.location.lat}, {vehicle.location.lon}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default MapComponent;

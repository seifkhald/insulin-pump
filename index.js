const db = require("./database/db_connection");
const express = require("express");
const app = express();
const router = require("./router/router");
app.use(express.json());
const PORT = 5000;
const TimeController = require('./Classes/TimeController');
const Patient = require('./models/patients');
const Device = require('./models/device');

// Initialize associations
const models = {
    Patient,
    Device
};

// Set up associations
Object.values(models).forEach(model => {
    if (model.associate) {
        model.associate(models);
    }
});

db.Connector.sync({ force: false })
    .then(async () => {
        console.log("Database synchronized with force. All tables recreated.");
        await TimeController.startSystem();
    })
    .catch((err) => {
        console.log("Failed to sync db:", err.message);
    });

app.use("/", router);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
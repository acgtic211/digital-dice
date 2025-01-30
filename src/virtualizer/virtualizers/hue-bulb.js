const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const mongoose = require('../configdb'); // Importa la configuración de la base de datos
const { thingInteractionSchema } = require('../models'); // Importa el esquema

dotenv.config();

// Crear el modelo de ThingInteraction
const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

// Variables de la bombilla virtual
let status = false;
let brightness = 100;
let color = "#FFFFFF"; // Color en formato hexadecimal

// Configuración del servidor
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('common'));

// Función para registrar interacciones en la base de datos
async function logInteraction(interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: "acg:lab:virtual-bulb",
      origen: "virtualDevice",
      interaction,
      data
    });
    await thingInteraction.save();
  } catch (err) {
    console.error("Error al guardar la interacción:", err);
  }
}

// Propiedad: Estado de la bombilla
app.get('/property/status', async (req, res) => {
  res.send({ status });
});

app.post('/property/status', async (req, res) => {
  const { status: newStatus } = req.body;
  if (typeof newStatus === "boolean") {
    status = newStatus;
    await logInteraction("property.status", { status });
    res.send({ status });
  } else {
    res.status(400).send({ error: "Invalid status. Must be a boolean." });
  }
});

// Propiedad: Brillo
app.get('/property/brightness', async (req, res) => {
  res.send({ brightness });
});

app.post('/property/brightness', async (req, res) => {
  const { brightness: newBrightness } = req.body;
  if (Number.isInteger(newBrightness) && newBrightness >= 0 && newBrightness <= 100) {
    brightness = newBrightness;
    await logInteraction("property.brightness", { brightness });
    res.send({ brightness });
  } else {
    res.status(400).send({ error: "Invalid brightness. Must be an integer between 0 and 100." });
  }
});

// Propiedad: Color
app.get('/property/color', async (req, res) => {
  res.send({ color });
});

app.post('/property/color', async (req, res) => {
  const { color: newColor } = req.body;
  if (/^#([0-9A-F]{6})$/i.test(newColor)) {
    color = newColor;
    await logInteraction("property.color", { color });
    res.send({ color });
  } else {
    res.status(400).send({ error: "Invalid color. Must be a valid HEX code." });
  }
});

// Configuración de HTTPS
https
  .createServer(
    {
      key: fs.readFileSync("/app/certs/privkey.pem"),
      cert: fs.readFileSync("/app/certs/fullchain.pem"),
    },
    app
  )
  .listen(process.env.PORT_VIRTUALIZER, (err) => {
    if (err) {
      throw new Error(err);
    }
    console.log("Listening on port " + process.env.PORT_VIRTUALIZER);
  });

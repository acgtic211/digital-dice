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

// Variables del switch de ordenador
let computerSwitchStatus = "OFF"; // Estado del switch: "ON" o "OFF"
let connectedComputers = 0; // Número de computadoras conectadas
let powerConsumption = 50.0; // Consumo de energía en vatios
let maxComputers = 20; // Capacidad máxima de computadoras conectadas

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
      device: "acg:lab:virtual-computer-switch",
      origen: "virtualDevice",
      interaction,
      data
    });
    await thingInteraction.save();
  } catch (err) {
    console.error("Error al guardar la interacción:", err);
  }
}

// Propiedad: Estado del switch
app.get('/property/status', async (req, res) => {
  res.send({ status: computerSwitchStatus });
});

app.post('/property/status', async (req, res) => {
  const { status } = req.body;
  if (status === "ON" || status === "OFF") {
    computerSwitchStatus = status;
    await logInteraction("property.status", { status: computerSwitchStatus });
    res.send({ status: computerSwitchStatus });
  } else {
    res.status(400).send({ error: "Estado inválido. Use 'ON' o 'OFF'." });
  }
});

// Propiedad: Computadoras conectadas
app.get('/property/connectedComputers', async (req, res) => {
  res.send({ connectedComputers });
});

// Acción: Conectar una computadora
app.post('/action/connectComputer', async (req, res) => {
  if (computerSwitchStatus === "OFF") {
    res.status(400).send({ error: "El switch está apagado. No se pueden conectar computadoras." });
    return;
  }
  if (connectedComputers < maxComputers) {
    connectedComputers++;
    powerConsumption += 10.0; // Incrementa el consumo de energía
    await logInteraction("action.connectComputer", { connectedComputers });
    res.send({ message: "Computadora conectada.", connectedComputers });
  } else {
    res.status(400).send({ error: "Capacidad máxima alcanzada." });
  }
});

// Acción: Desconectar una computadora
app.post('/action/disconnectComputer', async (req, res) => {
  if (connectedComputers > 0) {
    connectedComputers--;
    powerConsumption -= 10.0; // Reduce el consumo de energía
    await logInteraction("action.disconnectComputer", { connectedComputers });
    res.send({ message: "Computadora desconectada.", connectedComputers });
  } else {
    res.status(400).send({ error: "No hay computadoras conectadas para desconectar." });
  }
});

// Propiedad: Consumo de energía
app.get('/property/powerConsumption', async (req, res) => {
  res.send({ powerConsumption });
});

// Acción: Reiniciar el switch
app.post('/action/reboot', async (req, res) => {
  if (computerSwitchStatus === "OFF") {
    res.status(400).send({ error: "El switch está apagado. Enciéndalo antes de reiniciar." });
    return;
  }
  computerSwitchStatus = "OFF";
  connectedComputers = 0;
  powerConsumption = 50.0;
  await logInteraction("action.reboot", { status: "Rebooting" });
  setTimeout(async () => {
    computerSwitchStatus = "ON";
    await logInteraction("action.reboot", { status: "Rebooted" });
    res.send({ message: "Switch reiniciado exitosamente.", computerSwitchStatus });
  }, 3000); // Simula un tiempo de reinicio
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
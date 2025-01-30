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

// Variables del aspersor virtual
let status = true;
let percentageOpen = 70;
let action = "static";
let waterLeft = 50;

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
// Propiedad: Estado del aspersor
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

// Propiedad: Porcentaje de apertura
app.get('/property/percentageOpen', async (req, res) => {
  res.send({ percentageOpen });
});

app.post('/property/percentageOpen', async (req, res) => {
  const { percentageOpen: newPercentage } = req.body;
  if (Number.isInteger(newPercentage) && newPercentage >= 0 && newPercentage <= 100) {
    percentageOpen = newPercentage;
    status = newPercentage > 0; // Si el porcentaje es 0, el aspersor se apaga
    await logInteraction("property.percentageOpen", { percentageOpen });
    res.send({ percentageOpen });
  } else {
    res.status(400).send({ error: "Invalid percentageOpen. Must be an integer between 0 and 100." });
  }
});

// Propiedad: Acción del aspersor
app.get('/property/action', async (req, res) => {
  res.send({ action });
});

app.post('/property/action', async (req, res) => {
  const { action: newAction } = req.body;
  if (newAction === "static" || newAction === "movement") {
    action = newAction;
    await logInteraction("property.action", { action });
    res.send({ action });
  } else {
    res.status(400).send({ error: "Invalid action. Must be 'static' or 'movement'." });
  }
});

// Propiedad: Agua restante
app.get('/property/waterLeft', async (req, res) => {
  res.send({ waterLeft });
});

// Acción: Configurar el estado del aspersor
app.post('/action/setStatus', async (req, res) => {
  const { status: newStatus } = req.body;
  if (typeof newStatus === "boolean") {
    status = newStatus;
    await logInteraction("action.setStatus", { status });
    res.send({ status });
  } else {
    res.status(400).send({ error: "Invalid status. Must be a boolean." });
  }
});

// Acción: Configurar porcentaje de apertura
app.post('/action/setPercentageOpen', async (req, res) => {
  const { percentageOpen: newPercentage } = req.body;
  if (Number.isInteger(newPercentage) && newPercentage >= 0 && newPercentage <= 100) {
    percentageOpen = newPercentage;
    status = newPercentage > 0;
    await logInteraction("action.setPercentageOpen", { percentageOpen });
    res.send({ percentageOpen });
  } else {
    res.status(400).send({ error: "Invalid percentageOpen. Must be an integer between 0 and 100." });
  }
});

// Acción: Configurar acción del aspersor
app.post('/action/setAction', async (req, res) => {
  const { action: newAction } = req.body;
  if (newAction === "static" || newAction === "movement") {
    action = newAction;
    await logInteraction("action.setAction", { action });
    res.send({ action });
  } else {
    res.status(400).send({ error: "Invalid action. Must be 'static' or 'movement'." });
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

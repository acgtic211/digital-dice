const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const td = require('./tdLoader'); // Carga la TD directamente

// Importación de virtualizadores
const virtualBulb = require('./virtualizers/bulb');
const virtualBlind = require('./virtualizers/blind');
const virtualDoor = require('./virtualizers/door');
const virtualGarage = require('./virtualizers/garage-door');
const virtualHueBulb = require('./virtualizers/hue-bulb');
const virtualSensor = require('./virtualizers/sensor');
const virtualSwitch = require('./virtualizers/switch');
const virtualSmokeDetector = require('./virtualizers/smoke-detector');
const virtualWindow = require('./virtualizers/window');
const virtualSprinkler = require('./virtualizers/sprinkler');

dotenv.config();

const virtualizers = {
  "bulb": virtualBulb,
  "smoke-detector": virtualSmokeDetector,
  "garage-door": virtualGarage,
  "sensor": virtualSensor,
  "door": virtualDoor,
  "blind": virtualBlind,
  "hue-bulb": virtualHueBulb,
  "switch": virtualSwitch,
  "window": virtualWindow,
  "sprinkler": virtualSprinkler
};

function findMatchingType(type, virtualizers) {
  const typeLower = type.toLowerCase();
  return Object.keys(virtualizers).find(key => key.toLowerCase() === typeLower);
}

if (td["@type"] && td.id) {
  const types = Array.isArray(td["@type"]) ? td["@type"] : [td["@type"]];
  const tdId = td.id;

  let virtualizer;
  let matchedType;
  for (const type of types) {
    const matchingType = findMatchingType(type, virtualizers);
    if (matchingType) {
      virtualizer = virtualizers[matchingType];
      matchedType = type;
      break;
    }
  }

  if (virtualizer) {
    console.log(`✅ Iniciando virtualizador para ${matchedType} con ID: ${tdId}`);

    if (typeof virtualizer.startBehavior === "function") {
      virtualizer.startBehavior();
      console.log(`🚀 Comportamiento automático activado para ${matchedType}`);
    } else {
      console.warn(`⚠️ El virtualizador ${matchedType} no tiene comportamiento automático.`);
    }
  } else {
    console.error(`❌ No se encontró un virtualizador para los tipos: ${types}`);
    process.exit(1);
  }
} else {
  console.error("❌ Error: La TD no tiene '@type' o 'id'.");
  process.exit(1);
}

const port = process.env.PORT_VIRTUALIZER || 8065;
const sslOptions = {
  key: fs.readFileSync("/app/certs/privkey.pem"),
  cert: fs.readFileSync("/app/certs/fullchain.pem"),
};

https.createServer(sslOptions).listen(port, (err) => {
  if (err) {
    console.error("Error al iniciar el servidor HTTPS:", err);
    return;
  }
  console.log(`Servidor HTTPS en ejecución en el puerto ${port}`);
});

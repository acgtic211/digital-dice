const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let computerSwitchStatus = "OFF";
let connectedComputers = 0;
let powerConsumption = 50.0;
let maxComputers = 20;

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

function startBehavior() {
  setInterval(() => {
    // Encender el switch de forma aleatoria
    if (computerSwitchStatus === "OFF" && Math.random() > 0.7) {
      computerSwitchStatus = "ON";
      logInteraction("autoSwitchOn", { computerSwitchStatus });
      console.log("🔌 El switch se ha encendido automáticamente.");
    }

    if (computerSwitchStatus === "OFF") {
      console.log("⚠️ El switch está apagado. No se pueden realizar acciones.");
      return;
    }

    if (connectedComputers < maxComputers) {
      connectedComputers++;
      powerConsumption += 10.0;
      console.log(`🖥️ Computadora conectada. Total de computadoras conectadas: ${connectedComputers}`);
    } else {
      console.log("⚡ Capacidad máxima de computadoras conectadas alcanzada.");
    }

    logInteraction("autoConnectComputer", { connectedComputers, powerConsumption });

    if (Math.random() < 0.1 && connectedComputers > 0) {
      connectedComputers--;
      powerConsumption -= 10.0;
      console.log(`🔌 Computadora desconectada. Total de computadoras conectadas: ${connectedComputers}`);
      logInteraction("autoDisconnectComputer", { connectedComputers, powerConsumption });
    }

    if (powerConsumption > 100) {
      console.log("⚡ ¡Consumo de energía alto!");
    } else if (powerConsumption < 50) {
      console.log("💡 Consumo de energía bajo.");
    }

  }, 60000); // Cada 60 segundos
}

module.exports = {
  startBehavior
};
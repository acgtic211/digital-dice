const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let status = "CLOSED";
let percentageOpen = 0;

async function logInteraction(interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: "acg:lab:virtual-window",
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
    const randomValue = Math.random();

    if (status === "CLOSED" && randomValue < 0.3) { // 30% de probabilidad de abrirse
      status = "OPEN";
      percentageOpen = Math.floor(Math.random() * 100) + 1; // Apertura aleatoria entre 1 y 100
      console.log("🌬️ La ventana se ha abierto.");
      logInteraction("autoOpenWindow", { status, percentageOpen });
    } else if (status === "OPEN" && randomValue < 0.3) { // 30% de probabilidad de cerrarse
      status = "CLOSED";
      percentageOpen = 0;
      console.log("🌬️ La ventana se ha cerrado.");
      logInteraction("autoCloseWindow", { status, percentageOpen });
    } else {
      if (status === "CLOSED") {
        percentageOpen = Math.max(percentageOpen - 5, 0); // Decrementar porcentaje de apertura
      } else {
        percentageOpen = Math.min(percentageOpen + 5, 100); // Incrementar porcentaje de apertura
      }
    }

    console.log(`Estado: ${status} | Apertura: ${percentageOpen}%`);

    logInteraction("autoWindowUpdate", { status, percentageOpen });

  }, 60000); // Ejecuta cada minuto
}

module.exports = {
  startBehavior
};
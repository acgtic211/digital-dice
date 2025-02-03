const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let status = false;
let percentageOpen = 50; // Empieza a la mitad
let action = "static";
let waterLeft = 50; // Litros de agua restantes

async function logInteraction(interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: "acg:lab:virtual-sprinkler",
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
    // Activar el aspersor de forma aleatoria
    if (!status && Math.random() > 0.7) {
      status = true;
      percentageOpen = Math.floor(Math.random() * 100) + 1; // Apertura aleatoria entre 1 y 100
      logInteraction("autoActivate.status", { status, percentageOpen });
      console.log("💧 El aspersor se ha activado automáticamente.");
    }

    if (!status || waterLeft <= 0) return;

    let consumptionRate = (percentageOpen / 100) * 5; // Tasa de consumo basada en el porcentaje de apertura
    waterLeft = Math.max(waterLeft - consumptionRate, 0); // Reducir el agua restante

    // Si el action es "movement", cambiar dinámicamente el porcentaje de apertura
    if (action === "movement") {
      // Puedes hacer el movimiento de apertura de manera cíclica, por ejemplo:
      percentageOpen = (percentageOpen + 5) % 100; // Incrementa la apertura, reinicia en 100
    }

    console.log(`💧 Aspersor en uso: ${percentageOpen}% abierto. Agua restante: ${waterLeft}L`);

    if (waterLeft === 0) {
      status = false;
      console.log("❌ Sin agua. El aspersor se ha apagado.");
    }

    // Guardar la interacción
    logInteraction("autoWaterUsage", { percentageOpen, waterLeft, status, action });
  }, 60000); // Ejecuta cada minuto
}

module.exports = {
  startBehavior
};
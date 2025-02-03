const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let status = false;
let detectSmoke = false;

async function logInteraction(interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: "acg:lab:virtual-smoke-detector",
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
    // Activar el detector de humo de forma aleatoria
    if (!status && Math.random() > 0.7) {
      status = true;
      logInteraction("autoActivate.status", { status });
      console.log("🔔 El detector de humo se ha activado automáticamente.");
    }

    if (!status) return;

    // Detectar humo de forma aleatoria
    if (Math.random() < 0.05) {
      detectSmoke = true;
      logInteraction("autoDetectSmoke", { detectSmoke });
      console.log("🚨 ¡Alerta! Se detectó humo.");

      setTimeout(() => {
        detectSmoke = false;
        logInteraction("autoDetectSmoke", { detectSmoke });
        console.log("✅ Humo disipado, detector normal.");
      }, 180000); // 3 minutos
    }
  }, 60000); // Cada 60 segundos
}

module.exports = {
  startBehavior
};
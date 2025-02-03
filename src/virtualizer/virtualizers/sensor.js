const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let motion = false;
let battery = 100;
let temperature = 20;
let daylight = true;
let dark = false;
let illuminance = 3000;

async function logInteraction(interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: "acg:lab:virtual-sensor",
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
    motion = Math.random() < 0.3; 
    logInteraction("autoChange.motion", { motion });
    console.log(`🚶 Movimiento detectado: ${motion}`);
  }, Math.floor(Math.random() * (60000 - 30000) + 30000));

  setInterval(() => {
    battery = Math.max(0, battery - Math.random() * 2); 
    logInteraction("autoChange.battery", { battery });
    console.log(`🔋 Batería: ${battery.toFixed(1)}%`);

    if (battery < 20) {
      battery = 100; 
      console.log("⚡ Batería recargada al 100%");
      logInteraction("autoChange.battery", { battery });
    }
  }, 60000); 

  setInterval(() => {
    temperature += (Math.random() - 0.5) * 2; // Variación de ±1°C
    logInteraction("autoChange.temperature", { temperature });
    console.log(`🌡️ Temperatura ajustada a ${temperature.toFixed(1)}°C`);
  }, 60000); 

  setInterval(() => {
    const hour = new Date().getHours();
    daylight = hour >= 6 && hour < 18;
    dark = !daylight;
    illuminance = daylight ? Math.random() * (5000 - 2000) + 2000 : Math.random() * (500 - 100) + 100;
    
    logInteraction("autoChange.illuminance", { illuminance });
    logInteraction("autoChange.daylight", { daylight });
    logInteraction("autoChange.dark", { dark });

    console.log(`🌞 Día: ${daylight}, 🌙 Noche: ${dark}, 💡 Iluminancia: ${illuminance.toFixed(0)} lux`);
  }, 300000);
}

module.exports = {
  startBehavior
};
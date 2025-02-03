const mongoose = require('../configdb'); 
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let status = false;
let brightness = 100;
let color = "#FFFFFF";

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
    console.error("❌ Error al guardar la interacción:", err);
  }
}

function startBehavior() {
  setInterval(() => {
    const randomAction = Math.random();

    if (randomAction < 0.5) {
      status = !status;
      logInteraction("autoChange.status", { status });
      console.log(`💡 La bombilla ahora está ${status ? "ENCENDIDA" : "APAGADA"}`);
    }

  }, Math.floor(Math.random() * (120000 - 60000) + 60000)); 

  setInterval(() => {
    if (status) {
      brightness = Math.floor(Math.random() * (100 - 20) + 20);
      logInteraction("autoChange.brightness", { brightness });
      console.log(`🔆 Intensidad ajustada a ${brightness}%`);
    }
  }, 60000); 

  setInterval(() => {
    if (status) {
      color = getRandomColor();
      logInteraction("autoChange.color", { color });
      console.log(`🌈 Color cambiado a ${color}`);
    }
  }, 180000); 
}

function getRandomColor() {
  return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
}

module.exports = {
  startBehavior
};

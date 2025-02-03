const mongoose = require('../configdb');
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

// Variables del sensor de puerta
let status = "CLOSED";

async function logInteraction(interaction, data) {
    try {
        const thingInteraction = new ThingInteraction({
            device: "acg:lab:virtual-door",
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
        const randomChange = Math.random();
        
        if (randomChange < 0.3) {
            status = status === "CLOSED" ? "OPEN" : "CLOSED";
            logInteraction("autoChange.status", status);
            console.log(`🚪 La puerta ahora está: ${status}`);
        }
        
    }, Math.floor(Math.random() * (60000 - 20000) + 20000)); // Intervalo aleatorio entre 20s y 60s
}

// Exportar módulo con el comportamiento
module.exports = {
    startBehavior
  };

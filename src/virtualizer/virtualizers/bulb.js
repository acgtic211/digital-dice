const mongoose = require('../configdb'); 
const { thingInteractionSchema } = require('../models'); 

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

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
        console.error("Error al guardar la interacción:", err);
    }
}

let status = false;
let brightness = 0;

// Simulación de comportamiento dinámico
function startBehavior() {
    setInterval(() => {
        if (!status && Math.random() > 0.7) {
            status = true;
            brightness = Math.floor(Math.random() * 100) + 1; // Brillo aleatorio entre 1 y 100
            logInteraction("autoOn.status", status);
            logInteraction("autoOn.brightness", brightness);
            console.log("💡 Encendiendo la bombilla...");
        }

        if (status) {
            // Parpadeo aleatorio si la bombilla está encendida
            if (Math.random() > 0.8) {
                brightness = brightness > 50 ? 10 : 255;
                logInteraction("autoAdjust.brightness", brightness);
                console.log(`💡 Intensidad ajustada a ${brightness}%`);
            }

            // Ajuste automático de brillo si nadie lo cambia
            if (brightness < 50) {
                brightness += Math.floor(Math.random() * 20);
                logInteraction("autoAdjust.brightness", brightness);
                console.log(`💡 Intensidad ajustada a ${brightness}%`);
            }

            // Posible apagado automático después de un tiempo
            if (Math.random() > 0.9) {
                status = false;
                brightness = 0;
                logInteraction("autoOff.status", status);
                logInteraction("autoOff.brightness", brightness);
                console.log("💡 Apagando la bombilla...");
            }
        }
    }, 100000); // Cada 100 segundos
}

module.exports = {
  startBehavior
};

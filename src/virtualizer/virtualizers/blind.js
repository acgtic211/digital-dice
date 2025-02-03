const mongoose = require('../configdb'); 
const { thingInteractionSchema } = require('../models'); 


const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

// Variables del sensor
let status = "CLOSED"; // Abierta o Cerrada
let percentageOpen = 50; // Empieza a la mitad
let battery = 100; // Batería de la persiana
let motion = false;
let temperature = 20; // °C
let illuminance = 500; // Nivel de luz
let dark = false;
let daylight = true;

// Guardar en la base de datos
async function logInteraction(interaction, data) {
    try {
        const thingInteraction = new ThingInteraction({
            device: "acg:lab:virtual-blind",
            origen: "virtualDevice",
            interaction,
            data
        });
        await thingInteraction.save();
    } catch (err) {
        console.error("❌ Error al guardar la interacción:", err);
    }
}

// Comportamiento de la persiana
function simulateBlindBehavior() {
    const now = new Date();
    const hours = now.getHours();

    // 🔹 Simulación de apertura/cierre aleatorio cada cierto tiempo
    if (Math.random() > 0.5) {
        const delta = Math.floor(Math.random() * 31) - 15; // Entre -15% y +15%
        percentageOpen = Math.max(0, Math.min(100, percentageOpen + delta));
        status = percentageOpen === 0 ? "CLOSED" : "OPEN";
        motion = percentageOpen !== 0;
    }

    // 🔹 Ajuste de iluminación según la hora y la apertura
    if (hours >= 6 && hours <= 18) {
        illuminance = Math.min(1000, percentageOpen * 10);
    } else {
        illuminance = Math.max(50, percentageOpen * 5);
    }

    // 🔹 Día o noche según la iluminación
    dark = illuminance < 200;
    daylight = !dark;

    // 🔹 Simulación de temperatura
    if (hours >= 12 && hours <= 15) {
        temperature += percentageOpen > 70 ? 2 : 1;
    } else {
        temperature -= percentageOpen < 30 ? 1 : 0.5;
    }
    temperature = Math.max(10, Math.min(35, temperature)); 

    // 🔹 Descarga y recarga de la batería
    if (percentageOpen > 0) {
        battery = Math.max(0, battery - 1);
    } else {
        battery = Math.min(100, battery + 2);
    }

    // 🔹 Si la batería es menor al 20%, alguien la conecta a cargar
    if (battery < 20 && Math.random() > 0.7) {
        battery += 10;
    }

    // Guardar en la base de datos
    logInteraction("update", { 
        status, 
        motion, 
        percentageOpen, 
        illuminance, 
        temperature, 
        battery, 
        daylight, 
        dark 
    });

    console.log(`🔹 Persiana: ${status} | ${percentageOpen}% | Luz: ${illuminance} | Temp: ${temperature}°C | Batería: ${battery}%`);
}

// Método para iniciar el comportamiento de la persiana
function startBehavior() {
    setInterval(simulateBlindBehavior, Math.floor(Math.random() * (5 - 2 + 1) + 2) * 60 * 1000);
}

module.exports = {
    startBehavior
  };
const mongoose = require('../configdb'); 
const { thingInteractionSchema } = require('../models');

const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);

let status = "CLOSED";
let percentageOpen = 0;
let autoCloseTimeout;

async function logInteraction(interaction, data) {
    try {
        const thingInteraction = new ThingInteraction({
            device: "acg:lab:virtual-garage",
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

        if (randomAction < 0.4) {
            if (status === "CLOSED") {
                openGarage();
            } else {
                closeGarage();
            }
        }
        
    }, Math.floor(Math.random() * (120000 - 30000) + 30000)); 
}

function openGarage() {
    console.log("🔓 Abriendo garaje...");
    status = "OPEN";
    let interval = setInterval(() => {
        if (percentageOpen < 100) {
            percentageOpen += 10;
            logInteraction("autoChange.percentageOpen", { percentageOpen });
            console.log(`📈 Apertura: ${percentageOpen}%`);
        } else {
            clearInterval(interval);
            logInteraction("autoChange.status", { status });
            console.log("✅ Garaje completamente abierto.");
            scheduleAutoClose();
        }
    }, 3000); 
}

function closeGarage() {
    console.log("🔒 Cerrando garaje...");
    status = "CLOSED";
    let interval = setInterval(() => {
        if (percentageOpen > 0) {
            percentageOpen -= 10;
            logInteraction("autoChange.percentageOpen", { percentageOpen });
            console.log(`📉 Cierre: ${percentageOpen}%`);
        } else {
            clearInterval(interval);
            logInteraction("autoChange.status", { status });
            console.log("✅ Garaje completamente cerrado.");
        }
    }, 3000);
}

function scheduleAutoClose() {
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

    autoCloseTimeout = setTimeout(() => {
        if (status === "OPEN") {
            console.log("⏳ El garaje estuvo abierto por mucho tiempo. Cerrando automáticamente...");
            closeGarage();
        }
    }, Math.floor(Math.random() * (180000 - 60000) + 60000)); 
}

module.exports = {
    startBehavior
  };

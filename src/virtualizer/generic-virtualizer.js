const mongoose = require('./configdb');
const { thingInteractionSchema } = require('./models');
const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);
const path = require('path');
const fs = require('fs');
const affordancePath = path.join(__dirname, './affordance.json');
let affordance = {};

try {
  affordance = JSON.parse(fs.readFileSync(affordancePath, 'utf8'));
} catch (error) {
  console.error("❌ Error cargando affordance.json:", error);
}

console.log("Contenido de affordance.json:", JSON.stringify(affordance, null, 2));


const td = require('./tdLoader');
console.log("🔍 Thing Description cargada:", td);

async function logInteraction(deviceId, interaction, data) {
  try {
    const thingInteraction = new ThingInteraction({
      device: deviceId,
      origen: "virtualDevice",
      interaction,
      data
    });
    await thingInteraction.save();
  } catch (err) {
    console.error("❌ Error guardando en MongoDB:", err);
  }
}

function setValue(td, type, property, value) {
  if (!td.properties[type]) {
    return;
  }
  
  td.properties[type][property] = value;
}



async function initializeDatabase(affordance, td, defaultValues) {
  if (!affordance || typeof affordance !== 'object') {
    console.error("❌ Error: affordance.json no es un objeto válido.");
    return;
  }

  if (!defaultValues || typeof defaultValues !== 'object') {
    console.error(`❌ Error: 'default_values' no está definido en affordance.json o no es un objeto.`);
    return;
  }

  console.log("✅ Valores por defecto cargados:", defaultValues);

  for (const key of Object.keys(defaultValues)) {
    const [type, property] = key.split('.');
    const existingValue = await ThingInteraction.findOne({ device: td.thing_id, interaction: key });

    if (!existingValue) {
      setValue(td, type, property, defaultValues[key]);
      console.log(`🔹 Inicializando '${key}' con valor por defecto:`, defaultValues[key]);
      await logInteraction(td.thing_id, key, { value: defaultValues[key] });
    } else {
      setValue(td, type, property, existingValue.data);
      console.log(`✅ Usando valor existente para '${key}':`, existingValue.data);
    }
  }
}


function evaluateExpression(expression, context) {
  try {
    const evaluatedExpression = expression.replace(/property\.(\w+)/g, (_, prop) => {
      return context[prop] !== undefined ? context[prop] : 'undefined';
    });

    return new Function(...Object.keys(context), `return ${evaluatedExpression};`)(...Object.values(context));
  } catch (error) {
    console.error("❌ Error evaluando expresión:", expression, error);
    return null;
  }
}

async function applyBehaviors(td, behaviors) {
  if (!Array.isArray(behaviors)) {
    console.error("❌ Error: behaviors no es un array válido.");
    return;
  }

  let state = {};

  for (const rule of behaviors) {
    if (rule.map) {
      state[rule.map.out] = rule.map.value;
    } else if (rule.arithmeticExpression) {
      state[rule.arithmeticExpression.out] = evaluateExpression(rule.arithmeticExpression.eval_exp, state);
    } else if (rule.conditional) {
      evaluateExpression(rule.conditional.eval_exp, state);
    } else if (rule.distribution) {
      if (rule.distribution.type === "normal") {
        state[rule.distribution.out] = Math.round((Math.random() * rule.distribution.stddev * 2) + rule.distribution.mean);
      }
    }
  }

  for (const [interaction, value] of Object.entries(state)) {
    await logInteraction(td.thing_id, interaction, { value });
  }
}


async function startBehavior(td) {
  if (!td || typeof td !== "object") {
    console.error("❌ Error: Thing Description (td) no está definida o no es un objeto válido.");
    return;
  }

  // Obtener los valores por defecto desde affordance
  const defaultValues = affordance.default_values;

  if (!defaultValues || typeof defaultValues !== "object") {
    console.error(`❌ Error: 'default_values' no está definido en affordance.json para ${td.id} o no es un objeto.`);
    return;
  }

  if (!affordance.behaviour || !Array.isArray(affordance.behaviour)) {
    console.error(`❌ Error: 'behaviour' no está definido o no es un array en affordance.json.`);
    return;
  }

  await initializeDatabase(affordance, td, defaultValues);
  
  setInterval(async () => {
    console.log(`⏳ Ejecutando comportamiento para: ${td.id}`);
    await applyBehaviors(td, affordance.behaviour);
  }, affordance.timings * 1000);
}

module.exports = { startBehavior };

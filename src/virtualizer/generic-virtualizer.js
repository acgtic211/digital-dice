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

const td = require('./tdLoader');

let devices = {};

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

function applyConditions(device, td) {
  if (device.behaviour) {
    device.behaviour.forEach(behaviour => {
      if (behaviour.conditional) {
        try {
          const evalExp = behaviour.conditional.eval_exp;
          const func = new Function('property', 'action', 'event', evalExp);
          func(td.properties, td.actions, td.events);
        } catch (error) {
          console.error(`⚠️ Error evaluando condiciones en ${device.thing_id}:`, error);
        }
      }
    });
  }
}

async function initializeDatabase(td, defaultValues) {
  for (const key of Object.keys(defaultValues)) {
    const [type, property] = key.split('.');
    const existingValue = await ThingInteraction.findOne({ device: td.thing_id, interaction: key });

    if (!existingValue) {
      setValue(td, type, property, defaultValues[key]);
      console.log(`🔹 Inicializando '${key}' con valor por defecto:`, defaultValues[key]);
      await logInteraction(td.thing_id, key, defaultValues[key]); // Guardar el valor por defecto en la base de datos
    } else {
      setValue(td, type, property, existingValue.data);
      console.log(`✅ Usando valor existente para '${key}':`, existingValue.data);
    }
  }
}

function getValue(td, type, key) {
  if (!td[type] || !(key in td[type])) return undefined;
  const definition = td[type][key];
  return typeof definition === 'object' && 'value' in definition ? definition.value : definition;
}

function setValue(td, type, key, value) {
  if (!td[type]) td[type] = {};
  const definition = td[type][key];

  if (definition && typeof definition === 'object' && 'value' in definition) {
    definition.value = value;
  } else {
    td[type][key] = value;
  }
}

const safeEval = (expression) => {
  try {
    if (typeof expression !== 'string') {
      throw new TypeError('La expresión debe ser una cadena de texto');
    }

    const validExpression = expression.replace(/[^a-zA-Z0-9+\-*/()., ]/g, '');

    if (validExpression !== expression) {
      console.error("❌ Expresión contiene caracteres no válidos:", expression);
      return 0; 
    }

    const processedExpression = validExpression.replace(/temperature/g, td.properties.temperature || 0)
                                               .replace(/speed/g, td.properties.speed || 0);
    
    const result = new Function(`return ${processedExpression};`)();
    return result;
  } catch (error) {
    console.error("❌ Error evaluando expresión:", error);
    return 0; 
  }
};

function simulateDevice(device, td) {
  const tickRate = device.timings ? device.timings * 1000 : 60000;

  console.log(`⏱️ Intervalo de simulación para ${device.thing_id}: ${tickRate}ms`);

  setInterval(async () => {
    if (device.behaviour) {
      for (const behaviour of device.behaviour) {
        let value;

        if (behaviour.map) {
          value = behaviour.map.value;
          setValue(td, 'properties', behaviour.map.out, value);
          console.log(`📍 Map: ${value}`);
          await logInteraction(device.thing_id, behaviour.map.out, value);

        } else if (behaviour.list) {
          value = behaviour.list.values[Math.floor(Math.random() * behaviour.list.values.length)];
          setValue(td, 'properties', behaviour.list.out, value);
          console.log(`📋 List: ${value}`);
          await logInteraction(device.thing_id, behaviour.list.out, value);

        } else if (behaviour.arithmeticExpression) {
          const expression = behaviour.arithmeticExpression.eval_exp;
          value = safeEval(expression);

          if (value !== null) {
            setValue(td, 'properties', behaviour.arithmeticExpression.out, value);
            console.log(`📊 Calculado '${behaviour.arithmeticExpression.out}': ${value}`);
            await logInteraction(device.thing_id, behaviour.arithmeticExpression.out, value);
          }

        } else if (behaviour.distribution) {
          const mean = behaviour.distribution.mean;
          const stddev = behaviour.distribution.stddev;
          
          if (typeof mean !== 'number' || typeof stddev !== 'number') {
            console.error(`❌ Error: 'mean' o 'stddev' no son números válidos en ${device.thing_id}`);
            continue;
          }

          value = mean + stddev * (Math.random() * 2 - 1);
          setValue(td, 'properties', behaviour.distribution.out, parseFloat(value.toFixed(2)));
          console.log(`📈 Distribución: ${value}`);
          await logInteraction(device.thing_id, behaviour.distribution.out, parseFloat(value.toFixed(2)));
        }
      }
    }
  }, tickRate);
}

async function startBehavior(td) {
  if (!affordance || Object.keys(affordance).length === 0) {
    console.error("❌ No hay modelo en la estructura del JSON o está vacío.");
    return;
  }

  console.log(`✅ Iniciando virtualizador para ${affordance.thing_id} (ID: ${affordance.id})`);
  devices[affordance.thing_id] = affordance;
  await initializeDatabase(td, affordance.default_values);
  simulateDevice(affordance, td);
}

module.exports = { startBehavior };

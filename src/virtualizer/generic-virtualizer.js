const mongoose = require('./configdb');
const { thingInteractionSchema } = require('./models');
const ThingInteraction = mongoose.model('ThingInteraction', thingInteractionSchema);
const path = require('path');
const fs = require('fs');
const affordancePath = path.join(__dirname, './affordance.json');
let affordance = {};

try {
  affordance = JSON.parse(fs.readFileSync(affordancePath, 'utf8'));
  console.log("✅ Affordance.json cargado correctamente");
} catch (error) {
  console.error("❌ Error cargando affordance.json:", error);
  affordance = { 
    default_values: {}, 
    behaviour: [],
    timings: 10 
  };
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
    console.log(`✅ Interacción guardada para ${interaction}:`, data);
  } catch (err) {
    console.error("❌ Error guardando en MongoDB:", err);
  }
}

function setValue(td, type, property, value) {
  // Make sure properties and type exist
  if (!td.properties) {
    td.properties = {};
  }
  
  if (!td.properties[type]) {
    td.properties[type] = {};
  }
  
  td.properties[type][property] = value;
  console.log(`✅ Propiedad ${type}.${property} actualizada a:`, value);
}

async function initializeDatabase(affordance, td, defaultValues) {
  if (!affordance || typeof affordance !== 'object') {
    console.error("❌ Error: affordance.json no es un objeto válido.");
    return;
  }

  if (!defaultValues || typeof defaultValues !== 'object') {
    console.error("❌ Error: 'default_values' no está definido en affordance.json o no es un objeto.");
    return;
  }

  console.log("✅ Valores por defecto cargados:", defaultValues);

  for (const key of Object.keys(defaultValues)) {
    const [type, property] = key.split('.');
    if (!type || !property) {
      console.warn(`⚠️ Formato de clave inválido: ${key}, se esperaba 'tipo.propiedad'`);
      continue;
    }
    
    const existingValue = await ThingInteraction.findOne({ device: td.thing_id, interaction: key });

    if (!existingValue) {
      setValue(td, type, property, defaultValues[key]);
      console.log(`🔹 Inicializando '${key}' con valor por defecto:`, defaultValues[key]);
      await logInteraction(td.thing_id, key, { value: defaultValues[key] });
    } else {
      setValue(td, type, property, existingValue.data.value);
      console.log(`✅ Usando valor existente para '${key}':`, existingValue.data.value);
    }
  }
}

function evaluateArithmeticExpression(expression, context) {
  try {
    if (!expression || typeof expression !== 'string') {
      console.error("❌ Error: Expresión aritmética inválida:", expression);
      return 0;
    }
    
    console.log("📊 Evaluando expresión aritmética:", expression);
    
    // Create a context with flattened properties for easier reference
    const flatContext = {};
    for (const [key, value] of Object.entries(context)) {
      // Split keys like "sensor.temperature" to allow access as "sensor_temperature"
      flatContext[key.replace('.', '_')] = value;
      
      // Also add direct access for leaf properties
      const parts = key.split('.');
      if (parts.length === 2) {
        flatContext[parts[1]] = value;
      }
    }
    
    // Replace property references safely (property.temp -> context['sensor.temp'])
    const safeExpression = expression.replace(/property\.(\w+)/g, (_, prop) => {
      // Find the property in context by name or by "type.name"
      const directMatch = context[prop];
      const typeMatch = Object.keys(context).find(k => k.endsWith(`.${prop}`));
      
      const value = directMatch !== undefined ? directMatch : 
                    typeMatch !== undefined ? context[typeMatch] : 0;
      
      // Handle types appropriately to avoid NaN results
      if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (typeof value === 'number') {
        return value;
      }
      return 0;
    });
    
    console.log(`📊 Expresión transformada: ${safeExpression}`);
    
    // Create a safe evaluation sandbox
    const sandbox = {...flatContext};
    const result = new Function(...Object.keys(sandbox), `
      try {
        return ${safeExpression};
      } catch(e) {
        return 0;
      }
    `)(...Object.values(sandbox));
    
    console.log(`📊 Resultado de la expresión "${expression}":`, result);
    return isNaN(result) ? 0 : result;
  } catch (error) {
    console.error("❌ Error evaluando expresión aritmética:", expression, error);
    return 0;
  }
}

function evaluateConditionalExpression(expression, context) {
  try {
    if (!expression || typeof expression !== 'string') {
      console.error("❌ Error: Expresión condicional inválida:", expression);
      return false;
    }
    
    console.log("⚖️ Evaluando expresión condicional:", expression);
    
    // Create a context with flattened properties for easier reference
    const flatContext = {};
    for (const [key, value] of Object.entries(context)) {
      // Split keys like "sensor.temperature" to allow access as "sensor_temperature"
      flatContext[key.replace('.', '_')] = value;
      
      // Also add direct access for leaf properties
      const parts = key.split('.');
      if (parts.length === 2) {
        flatContext[parts[1]] = value;
      }
    }
    
    // Replace property references safely
    const safeExpression = expression.replace(/property\.(\w+)/g, (_, prop) => {
      // Find the property in context by name or by "type.name"
      const directMatch = context[prop];
      const typeMatch = Object.keys(context).find(k => k.endsWith(`.${prop}`));
      
      const value = directMatch !== undefined ? directMatch : 
                    typeMatch !== undefined ? context[typeMatch] : undefined;
      
      if (value === undefined || value === null) {
        return "false";
      }
      
      // Handle different types appropriately for comparison
      if (typeof value === 'boolean') {
        return value.toString();
      } else if (typeof value === 'string') {
        return `"${value}"`;
      } else if (typeof value === 'number') {
        return value;
      }
      return "false";
    });
    
    console.log(`⚖️ Condición transformada: ${safeExpression}`);
    
    // Create a safe evaluation sandbox
    const sandbox = {...flatContext};
    const result = new Function(...Object.keys(sandbox), `
      try {
        return ${safeExpression};
      } catch(e) {
        return false;
      }
    `)(...Object.values(sandbox));
    
    console.log(`⚖️ Resultado de la condición "${expression}":`, result);
    return !!result; // Ensure boolean return
  } catch (error) {
    console.error("❌ Error evaluando expresión condicional:", expression, error);
    return false;
  }
}

async function applyBehaviors(td, behaviors) {
  if (!Array.isArray(behaviors)) {
    console.error("❌ Error: behaviors no es un array válido.");
    return;
  }

  let state = {};
  // Populate initial state from current TD properties
  if (td.properties) {
    for (const type in td.properties) {
      for (const prop in td.properties[type]) {
        state[`${type}.${prop}`] = td.properties[type][prop];
      }
    }
  }
  
  console.log("🔄 Estado inicial:", state);

  for (const rule of behaviors) {
    try {
      // Validate rule structure before processing
      if (!rule || typeof rule !== 'object') {
        console.error("❌ Error: Regla inválida:", rule);
        continue;
      }

      // Process different rule types
      if (rule.map && rule.map.out && rule.map.value !== undefined) {
        // Map simply maps a value to an output property
        const outputKey = rule.map.out;
        state[outputKey] = rule.map.value;
        console.log(`🔄 Regla map: ${outputKey} = ${rule.map.value}`);
      } 
      else if (rule.arithmeticExpression && rule.arithmeticExpression.out && rule.arithmeticExpression.eval_exp) {
        // Parse arithmetic expressions like "property.temperature * 2 + 10"
        const outputKey = rule.arithmeticExpression.out;
        const expressionResult = evaluateArithmeticExpression(rule.arithmeticExpression.eval_exp, state);
        
        // Convert to appropriate type if needed
        const parsedValue = typeof expressionResult === 'string' && !isNaN(expressionResult) ? 
            parseFloat(expressionResult) : expressionResult;
        
        state[outputKey] = parsedValue;
        console.log(`🔄 Regla aritmética: ${outputKey} = ${parsedValue} (${typeof parsedValue})`);
      } 
      else if (rule.conditional && rule.conditional.out && rule.conditional.eval_exp) {
        // Parse conditional expressions like "property.temperature > 25"
        const outputKey = rule.conditional.out;
        const conditionResult = evaluateConditionalExpression(rule.conditional.eval_exp, state);
        state[outputKey] = conditionResult;
        console.log(`🔄 Regla condicional: ${outputKey} = ${conditionResult} (${typeof conditionResult})`);
      } 
      else if (rule.distribution && rule.distribution.out) {
        // Generate random values according to distributions
        const outputKey = rule.distribution.out;
        
        if (rule.distribution.type === "normal" && 
            typeof rule.distribution.mean === 'number' && 
            typeof rule.distribution.stddev === 'number') {
          // Box-Muller transform for better normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const value = Math.round(z0 * rule.distribution.stddev + rule.distribution.mean);
          
          state[outputKey] = value;
          console.log(`🔄 Distribución normal: ${outputKey} = ${value}`);
        }
        else if (rule.distribution.type === "uniform" && 
                typeof rule.distribution.min === 'number' && 
                typeof rule.distribution.max === 'number') {
          // Uniform distribution between min and max
          const min = rule.distribution.min;
          const max = rule.distribution.max;
          const value = Math.round(min + Math.random() * (max - min));
          
          state[outputKey] = value;
          console.log(`🔄 Distribución uniforme: ${outputKey} = ${value}`);
        }
        else {
          console.error(`❌ Error: Tipo de distribución no soportada o parámetros inválidos:`, rule.distribution);
        }
      }
      else {
        console.warn(`⚠️ Regla desconocida o mal formada:`, rule);
      }
    } catch (error) {
      console.error("❌ Error aplicando regla:", rule, error);
    }
  }

  console.log("📌 Estado final después de aplicar reglas:", state);

  // Update TD and log interactions
  for (const [interaction, value] of Object.entries(state)) {
    try {
      const [type, property] = interaction.split('.');
      if (type && property) {
        // Only update if the value is valid
        if (value !== undefined && value !== null) {
          // Convert to appropriate type if needed
          let processedValue = value;
          // For numerical properties stored as strings, ensure they're numbers
          if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            processedValue = parseFloat(value);
          }
          
          setValue(td, type, property, processedValue);
          await logInteraction(td.thing_id, interaction, { value: processedValue });
          console.log(`✅ Actualizada propiedad ${interaction} = ${processedValue} (${typeof processedValue})`);
        } else {
          console.warn(`⚠️ Valor inválido para ${interaction}: ${value}`);
        }
      } else {
        console.warn(`⚠️ Formato de interacción inválido: ${interaction}, se esperaba 'tipo.propiedad'`);
      }
    } catch (error) {
      console.error(`❌ Error actualizando interacción ${interaction}:`, error);
    }
  }
}

async function startBehavior(td) {
  if (!td || typeof td !== "object") {
    console.error("❌ Error: Thing Description (td) no está definida o no es un objeto válido.");
    return;
  }

  const defaultValues = affordance.default_values;

  if (!defaultValues || typeof defaultValues !== "object") {
    console.error(`❌ Error: 'default_values' no está definido en affordance.json para ${td.id || 'dispositivo desconocido'} o no es un objeto.`);
    return;
  }

  if (!affordance.behaviour || !Array.isArray(affordance.behaviour)) {
    console.error("❌ Error: 'behaviour' no está definido o no es un array en affordance.json.");
    return;
  }

  // Make sure TD has thing_id
  if (!td.thing_id && td.id) {
    td.thing_id = td.id;
  }

  await initializeDatabase(affordance, td, defaultValues);
  
  const intervalTime = (affordance.timings || 10) * 1000; // Default to 10 seconds if not specified
  console.log(`🕒 Configurando intervalo de comportamiento cada ${intervalTime/1000} segundos`);
  
  const intervalId = setInterval(async () => {
    console.log(`⏳ Ejecutando comportamiento para: ${td.id || td.thing_id || 'dispositivo desconocido'}`);
    await applyBehaviors(td, affordance.behaviour);
  }, intervalTime);
  
  // Return the intervalId so it can be cleared if needed
  return intervalId;
}

module.exports = { startBehavior, applyBehaviors, evaluateArithmeticExpression, evaluateConditionalExpression };
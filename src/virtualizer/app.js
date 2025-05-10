const fs = require("fs");
const path = require('path');
const instances = require('./instances');

const jsonFilePath = path.join('/app/behavior', 'behavior.json');

// Array to hold multiple behaviors when multi-instancing is enabled
let behaviors = [];

function loadBaseBehavior() {
  try {
    // Check if file exists and has content before reading
    const stats = fs.statSync(jsonFilePath);

    if (stats.size === 0) {
      console.error('Error: El archivo behavior.json está vacío (sin texto)');
      process.exit(1);
    }

    const data = fs.readFileSync(jsonFilePath, 'utf8');

    if (!data || data.trim() === "") {
      console.error('Error: El archivo behavior.json contiene solo espacios en blanco o está vacío');
      process.exit(1);
    }

    const behavior = JSON.parse(data);

    if (Object.keys(behavior).length === 0) {
      console.error('Error: El contenido del behavior está vacío');
      process.exit(1);
    }

    return behavior;
    
  } catch (err) {
    console.error('Error leyendo o parseando el archivo JSON:', err);
    process.exit(1);
  }
}

/**
 * Generates a random number based on the specified distribution
 * @param {object} config - The configuration with min, max, and distribution details
 * @returns {number} - A random value
 */
function generateRandomValue(config) {
  if (config.distribution === 'normal' && config.mean !== undefined && config.standardDeviation !== undefined) {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Apply mean and standard deviation, then clamp to min-max
    let value = z * config.standardDeviation + config.mean;
    return Math.max(config.min, Math.min(config.max, value));
  } else {
    // Uniform distribution
    return config.min + Math.random() * (config.max - config.min);
  }
}

/**
 * Picks a random value from a list
 * @param {Array} values - List of possible values
 * @returns {any} - A randomly selected value
 */
function pickRandomFromList(values) {
  const index = Math.floor(Math.random() * values.length);
  return values[index];
}

/**
 * Applies custom TG generation rules based on the thing description
 * @param {object} behavior - The behavior configuration
 * @param {string} thingId - The ID of the current instance
 * @returns {object} - The behavior with customized values
 */
function applyThingGenerationRules(behavior, thingId) {
  const baseTdId = behavior.thing_id.split(':').slice(0, -1).join(':');
  const rules = instances.thingGenerationRules[baseTdId];
  
  if (!rules) return behavior;
  
  const customizedBehavior = JSON.parse(JSON.stringify(behavior));
  
  // Apply randomization to properties
  if (rules.randomizeProperties) {
    for (const propConfig of rules.randomizeProperties) {
      const value = generateRandomValue(propConfig);
      if (!customizedBehavior.default_values) {
        customizedBehavior.default_values = {};
      }
      customizedBehavior.default_values[propConfig.property] = propConfig.property.endsWith('.value') ? 
        value : { value: value };
    }
  }
  
  // Apply list selection to properties
  if (rules.listProperties) {
    for (const listConfig of rules.listProperties) {
      const value = pickRandomFromList(listConfig.values);
      if (!customizedBehavior.default_values) {
        customizedBehavior.default_values = {};
      }
      customizedBehavior.default_values[listConfig.property] = listConfig.property.endsWith('.value') ? 
        value : { value: value };
    }
  }
  
  return customizedBehavior;
}

/**
 * Creates multiple behavior instances based on configuration
 */
function createBehaviorInstances() {
  const baseBehavior = loadBaseBehavior();
  
  if (!instances.enableMultiInstance) {
    return [baseBehavior];
  }
  
  const instancesArray = [];
  const specificInstances = instances.instances && instances.instances.length > 0;
  const count = specificInstances ? instances.instances.length : instances.baseConfig.instanceCount;
  
  for (let i = 0; i < count; i++) {
    // Clone the base behavior
    const instanceBehavior = JSON.parse(JSON.stringify(baseBehavior));
    
    // Set the instance-specific thing ID
    const instanceId = specificInstances ? instances.instances[i].id : (i + 1).toString();
    instanceBehavior.thing_id = instances.baseConfig.instanceIdPattern.replace('{id}', instanceId);
    
    // Apply thing generation rules
    let customizedBehavior = applyThingGenerationRules(instanceBehavior, instanceId);
    
    // Apply custom defaults if specified
    if (specificInstances && instances.instances[i].customDefaults) {
      if (!customizedBehavior.default_values) {
        customizedBehavior.default_values = {};
      }
      
      Object.assign(customizedBehavior.default_values, instances.instances[i].customDefaults);
    }
    
    instancesArray.push(customizedBehavior);
  }
  
  console.log(`Created ${instancesArray.length} virtualized instances`);
  return instancesArray;
}

// Initialize behaviors array
behaviors = createBehaviorInstances();

// For backward compatibility, provide the first behavior as default export
const defaultBehavior = behaviors[0];

module.exports = {
  default: defaultBehavior,
  behaviors: behaviors,
  isMultiInstance: instances.enableMultiInstance
};
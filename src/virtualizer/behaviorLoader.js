const fs = require("fs");
const path = require('path');

// Cambiamos la forma en que cargamos el archivo de instancias
// para que funcione tanto en desarrollo como en producción
let instances;
const instancesPath = path.join('/app/instances', 'instances.json');
const localInstancesPath = path.join(__dirname, 'instances.json');
const jsonFilePath = path.join('/app/behavior', 'behavior.json');
const localJsonFilePath = path.join(__dirname, 'behavior.json');

// Crear un archivo instances.json por defecto si no existe
function createDefaultInstancesFile() {
  const defaultInstances = {
    "enableMultiInstance": true,
    "baseConfig": {
      "instanceCount": 3,
      "instanceIdPattern": "acg:lab:container:{id}"
    },
    "instances": [
      {
        "id": "1",
        "customDefaults": {
          "location.value": "Downtown"
        }
      },
      {
        "id": "2",
        "customDefaults": {
          "location.value": "Suburb",
          "capacity.value": 250
        }
      },
      {
        "id": "3",
        "customDefaults": {
          "location.value": "Industrial Zone",
          "capacity.value": 500,
          "garbageClass.value": "Industrial"
        }
      }
    ],
    "thingGenerationRules": {
      "acg:lab:container": {
        "randomizeProperties": [
          {
            "property": "capacity.value",
            "min": 100,
            "max": 1000,
            "distribution": "normal",
            "mean": 300,
            "standardDeviation": 150
          },
          {
            "property": "garbageLevel.value",
            "min": 0,
            "max": 50
          }
        ],
        "listProperties": [
          {
            "property": "location.value",
            "values": ["Downtown", "Business District", "Residential Area", "Industrial Zone", "Park", "Harbor", "Airport"]
          },
          {
            "property": "garbageClass.value",
            "values": ["General", "Recyclable", "Organic", "Industrial", "Hazardous"]
          }
        ]
      }
    }
  };

  try {
    fs.writeFileSync(localInstancesPath, JSON.stringify(defaultInstances, null, 2));
    console.log('Archivo instances.json creado con configuración por defecto');
    return defaultInstances;
  } catch (error) {
    console.error('No se pudo crear el archivo de instancias por defecto:', error);
    return { enableMultiInstance: false };
  }
}

// Intentar cargar el archivo de instancias desde diferentes ubicaciones
try {
  if (fs.existsSync(instancesPath)) {
    console.log('Cargando configuración desde', instancesPath);
    instances = JSON.parse(fs.readFileSync(instancesPath, 'utf8'));
  } else if (fs.existsSync(localInstancesPath)) {
    console.log('Cargando configuración desde', localInstancesPath);
    instances = JSON.parse(fs.readFileSync(localInstancesPath, 'utf8'));
  } else {
    console.warn('No se encontró el archivo de configuración de instancias, creando configuración predeterminada');
    instances = createDefaultInstancesFile();
  }
  
  // Verificar que la configuración sea válida
  if (!instances || typeof instances !== 'object') {
    console.error('La configuración cargada no es válida, usando configuración predeterminada');
    instances = createDefaultInstancesFile();
  }
  
  // Asegurarse de que enableMultiInstance esté definido
  if (instances.enableMultiInstance === undefined) {
    console.warn('La propiedad enableMultiInstance no está definida, activando multi-instanciación');
    instances.enableMultiInstance = true;
  }

} catch (error) {
  console.error('Error al cargar el archivo de instancias:', error);
  instances = createDefaultInstancesFile();
}

// Verificar si tenemos una configuración válida para la multi-instanciación
if (instances.enableMultiInstance && (!instances.baseConfig || !instances.baseConfig.instanceIdPattern)) {
  console.error('Configuración de multi-instanciación incompleta, se requiere baseConfig.instanceIdPattern');
  instances.baseConfig = instances.baseConfig || {};
  instances.baseConfig.instanceIdPattern = "acg:lab:container:{id}";
  instances.baseConfig.instanceCount = instances.baseConfig.instanceCount || 3;
}

// Array to hold multiple behaviors when multi-instancing is enabled
let behaviors = [];

function loadBaseBehavior() {
  try {
    // Check if file exists and has content before reading
    let behaviorFilePath;
    
    if (fs.existsSync(jsonFilePath)) {
      behaviorFilePath = jsonFilePath;
      console.log('Usando archivo behavior.json desde ruta de producción');
    } else if (fs.existsSync(localJsonFilePath)) {
      behaviorFilePath = localJsonFilePath;
      console.log('Usando archivo behavior.json desde ruta de desarrollo');
    } else {
      console.error('No se encontró el archivo behavior.json');
      process.exit(1);
    }
    
    const stats = fs.statSync(behaviorFilePath);

    if (stats.size === 0) {
      console.error('Error: El archivo behavior.json está vacío (sin texto)');
      process.exit(1);
    }

    const data = fs.readFileSync(behaviorFilePath, 'utf8');

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
  if (!instances.thingGenerationRules) {
    console.log(`No hay reglas de generación definidas para ningún dispositivo`);
    return behavior;
  }
  
  const baseTdId = behavior.thing_id.split(':').slice(0, -1).join(':');
  console.log(`Buscando reglas para base TD ID: ${baseTdId}`);
  
  const rules = instances.thingGenerationRules[baseTdId];
  
  if (!rules) {
    console.log(`No se encontraron reglas para ${baseTdId}`);
    return behavior;
  }
  
  console.log(`Aplicando reglas de generación para ${baseTdId}`);
  const customizedBehavior = JSON.parse(JSON.stringify(behavior));
  
  // Asegurarse de que default_values existe
  if (!customizedBehavior.default_values) {
    customizedBehavior.default_values = {};
  }
  
  // Apply randomization to properties
  if (rules.randomizeProperties) {
    for (const propConfig of rules.randomizeProperties) {
      const value = generateRandomValue(propConfig);
      console.log(`Generando valor aleatorio para ${propConfig.property}: ${value}`);
      
      customizedBehavior.default_values[propConfig.property] = propConfig.property.endsWith('.value') ? 
        value : { value: value };
    }
  }
  
  // Apply list selection to properties
  if (rules.listProperties) {
    for (const listConfig of rules.listProperties) {
      const value = pickRandomFromList(listConfig.values);
      console.log(`Seleccionando valor de lista para ${listConfig.property}: ${value}`);
      
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
    console.log('Multi-instanciación desactivada, usando una única instancia');
    return [baseBehavior];
  }
  
  console.log('Multi-instanciación activada, creando múltiples instancias');
  
  const instancesArray = [];
  const specificInstances = instances.instances && instances.instances.length > 0;
  const count = specificInstances ? instances.instances.length : instances.baseConfig.instanceCount;
  
  console.log(`Configuración de instancias específicas: ${specificInstances ? 'Sí' : 'No'}`);
  console.log(`Número de instancias a crear: ${count}`);
  
  for (let i = 0; i < count; i++) {
    // Clone the base behavior
    const instanceBehavior = JSON.parse(JSON.stringify(baseBehavior));
    
    // Set the instance-specific thing ID
    const instanceId = specificInstances ? instances.instances[i].id : (i + 1).toString();
    instanceBehavior.thing_id = instances.baseConfig.instanceIdPattern.replace('{id}', instanceId);
    
    console.log(`Creando instancia ${instanceBehavior.thing_id}`);
    
    // Apply thing generation rules
    let customizedBehavior = applyThingGenerationRules(instanceBehavior, instanceId);
    
    // Apply custom defaults if specified
    if (specificInstances && instances.instances[i].customDefaults) {
      console.log(`Aplicando valores personalizados para instancia ${instanceId}`);
      
      if (!customizedBehavior.default_values) {
        customizedBehavior.default_values = {};
      }
      
      Object.assign(customizedBehavior.default_values, instances.instances[i].customDefaults);
      console.log(`Valores personalizados aplicados: `, instances.instances[i].customDefaults);
    }
    
    instancesArray.push(customizedBehavior);
  }
  
  console.log(`Creadas ${instancesArray.length} instancias virtualizadas`);
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
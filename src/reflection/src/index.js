const dotenv = require('dotenv');
dotenv.config();

const db = require('./config');

// Load connection libraries dynamically
const connectors = {};

// Try loading KNX connector
try {
  connectors.knx = require('wotnectivity-knx');
  console.log('KNX connector loaded successfully');
} catch (e) {
  console.log('KNX connector not available');
}

// Try loading MQTT connector
try {
  connectors.mqtt = require('mqtt');
  console.log('MQTT connector loaded successfully');
} catch (e) {
  console.log('MQTT connector not available');
}

// Try loading HTTP connector (axios)
try {
  connectors.http = require('axios');
  console.log('HTTP connector loaded successfully');
} catch (e) {
  console.log('HTTP connector not available');
}

var thingInteractionSchema = require('./models');
var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

// Store active connections and subscriptions
const deviceConnections = new Map();
const subscriptions = new Map();
var interactions = {};
var lastInteractionTime = {};

// Load device configurations from environment variables
function loadDeviceConfigurations() {
  // Get all environment variables that define devices
  const deviceEnvVars = Object.keys(process.env).filter(key => 
    key.startsWith('DEVICE_') && !key.includes('_MAPPINGS')
  );
  
  // Process each device configuration
  for (const envVar of deviceEnvVars) {
    const deviceConfig = process.env[envVar].split(';');
    
    // Validate config format
    if (deviceConfig.length < 3) {
      console.warn(`Invalid device configuration format for ${envVar}: ${process.env[envVar]}`);
      continue;
    }
    
    // Extract configuration
    const [deviceId, protocol, connection, port, username, password] = deviceConfig;
    
    // Create device configuration object
    const deviceInfo = {
      id: deviceId,
      protocol: protocol.toLowerCase(),
      connection: connection,
      port: port || getDefaultPort(protocol),
      username: username || null,
      password: password || null,
      mappings: {}
    };
    
    // Check for mappings
    const mappingsEnvVar = `${envVar}_MAPPINGS`;
    if (process.env[mappingsEnvVar]) {
      const mappings = process.env[mappingsEnvVar].split(',');
      
      for (const mapping of mappings) {
        const [property, read, write, dataType] = mapping.split(';');
        deviceInfo.mappings[property] = {
          read,
          write,
          dataType
        };
      }
    }
    
    // Store device configuration
    deviceConnections.set(deviceId, deviceInfo);
    console.log(`Loaded configuration for device ${deviceId} using ${protocol}`);
  }

  // For backward compatibility, add suitcase if SUITCASE_URI is defined
  if (process.env.SUITCASE_URI && !deviceConnections.has('acg:lab:suitcase-dd')) {
    // Example mappings from the original suitcase implementation
    deviceConnections.set('acg:lab:suitcase-dd', {
      id: 'acg:lab:suitcase-dd',
      protocol: 'knx',
      connection: process.env.SUITCASE_URI,
      mappings: {
        'status-light1': { read: '2/0/1', write: '2/0/0', dataType: 'DPT1.001' },
        'status-light2': { read: '2/1/1', write: '2/1/0', dataType: 'DPT1.001' },
        'status-water': { read: '5/1/0', write: '5/1/0', dataType: 'DPT1.001' },
        'status-fire': { read: '5/0/0', write: '5/0/0', dataType: 'DPT1.001' },
        'luminosity-dimmer1': { read: '3/0/3', write: '3/0/2', dataType: 'DPT5.001' },
        'luminosity-dimmer2': { read: '3/1/3', write: '3/1/2', dataType: 'DPT5.001' }
      }
    });
    console.log('Added suitcase device from SUITCASE_URI for backward compatibility');
  }
}

// Get default port for a protocol
function getDefaultPort(protocol) {
  switch (protocol.toLowerCase()) {
    case 'http': return '80';
    case 'https': return '443';
    case 'mqtt': return '1883';
    case 'mqtts': return '8883';
    case 'knx': return '3671';
    default: return null;
  }
}

// Subscribe to device property changes
async function subscribeToDevices() {
  console.log('Setting up subscriptions to device properties...');
  
  for (const [deviceId, config] of deviceConnections.entries()) {
    try {
      switch (config.protocol) {
        case 'knx':
          await subscribeToKnxDevice(deviceId, config);
          break;
        case 'mqtt':
        case 'mqtts':
          await subscribeToMqttDevice(deviceId, config);
          break;
        case 'http':
        case 'https':
          setupHttpPolling(deviceId, config);
          break;
        default:
          console.warn(`Unsupported protocol ${config.protocol} for device ${deviceId}`);
      }
    } catch (error) {
      console.error(`Error setting up subscription for device ${deviceId}:`, error);
    }
  }
}

// Subscribe to KNX device properties
async function subscribeToKnxDevice(deviceId, config) {
  if (!connectors.knx) {
    console.error(`KNX connector not available for device ${deviceId}`);
    return;
  }
  
  // Prepare subscription groups
  const groups = [];
  for (const [propertyName, mapping] of Object.entries(config.mappings)) {
    if (mapping.read && mapping.dataType) {
      groups.push({ group: mapping.read, dataType: mapping.dataType });
    }
  }
  
  if (groups.length === 0) {
    console.warn(`No KNX mappings found for device ${deviceId}`);
    return;
  }
  
  console.log(`Subscribing to ${groups.length} KNX groups for device ${deviceId}`);
  
  // Subscribe to KNX groups
  try {
    const statusProp = await connectors.knx.sendRequest(
      config.connection,
      { requestType: "subscribe", groups: groups }
    );
    
    statusProp.subscribe(async (data) => {
      // Find property name from group address
      let propertyName = null;
      let propertyValue = null;
      
      for (const [name, mapping] of Object.entries(config.mappings)) {
        if (mapping.read === data.group) {
          propertyName = name;
          
          // Format property value based on data type
          if (mapping.dataType === 'DPT1.001') {
            propertyValue = { value: data.value };
          } else if (mapping.dataType === 'DPT5.001') {
            propertyValue = { brightness: data.value };
          } else {
            propertyValue = { value: data.value };
          }
          
          break;
        }
      }
      
      if (!propertyName) {
        console.warn(`Received data for unknown KNX group: ${data.group}`);
        return;
      }
      
      // Create ThingInteraction
      const interactionValue = new ThingInteraction({
        device: deviceId,
        origen: "physicalDevice",
        interaction: `property.${propertyName}`,
        data: propertyValue
      });
      
      console.log(`Device ${deviceId} property ${propertyName} changed:`, propertyValue);
      
      // Save to database
      interactionValue.save(function(err) {
        if (err) {
          console.error(`Error saving interaction for ${deviceId}.${propertyName}:`, err);
        }
      });
    });
    
    // Store subscription for later
    subscriptions.set(`knx:${deviceId}`, statusProp);
    console.log(`Successfully subscribed to KNX device ${deviceId}`);
  } catch (error) {
    console.error(`Error subscribing to KNX device ${deviceId}:`, error);
  }
}

// Subscribe to MQTT device properties
async function subscribeToMqttDevice(deviceId, config) {
  if (!connectors.mqtt) {
    console.error(`MQTT connector not available for device ${deviceId}`);
    return;
  }
  
  try {
    // Connect to MQTT broker
    const mqttOptions = {};
    if (config.username && config.password) {
      mqttOptions.username = config.username;
      mqttOptions.password = config.password;
    }
    
    // Build connection URL
    const mqttUrl = `${config.protocol}://${config.connection}:${config.port}`;
    console.log(`Connecting to MQTT broker at ${mqttUrl}`);
    
    const client = connectors.mqtt.connect(mqttUrl, mqttOptions);
    
    client.on('connect', () => {
      console.log(`Connected to MQTT broker for device ${deviceId}`);
      
      // Subscribe to topics based on mappings
      if (Object.keys(config.mappings).length > 0) {
        for (const [propertyName, mapping] of Object.entries(config.mappings)) {
          const topic = mapping.read || `${deviceId}/properties/${propertyName}`;
          
          client.subscribe(topic, (err) => {
            if (err) {
              console.error(`Error subscribing to MQTT topic ${topic}:`, err);
            } else {
              console.log(`Subscribed to MQTT topic ${topic} for device ${deviceId}`);
            }
          });
        }
      } else {
        // If no specific mappings, subscribe to all device properties
        const topic = `${deviceId}/properties/#`;
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error subscribing to MQTT topic ${topic}:`, err);
          } else {
            console.log(`Subscribed to MQTT topic ${topic} for device ${deviceId}`);
          }
        });
      }
    });
    
    client.on('message', (topic, message) => {
      try {
        // Find property name from topic
        let propertyName;
        let propertyValue;
        
        // Check if we have a mapping for this topic
        for (const [propName, mapping] of Object.entries(config.mappings)) {
          if (mapping.read === topic) {
            propertyName = propName;
            break;
          }
        }
        
        // If no mapping found, try to parse from topic structure
        if (!propertyName) {
          const parts = topic.split('/');
          if (parts.length >= 3 && parts[1] === 'properties') {
            propertyName = parts.slice(2).join('-');
          } else {
            // Unable to determine property name
            console.warn(`Unable to determine property name from MQTT topic: ${topic}`);
            return;
          }
        }
        
        // Parse message
        try {
          propertyValue = JSON.parse(message.toString());
        } catch (e) {
          // If not JSON, use raw value
          propertyValue = { value: message.toString() };
        }
        
        // Create ThingInteraction
        const interactionValue = new ThingInteraction({
          device: deviceId,
          origen: "physicalDevice",
          interaction: `property.${propertyName}`,
          data: propertyValue
        });
        
        console.log(`Device ${deviceId} property ${propertyName} changed:`, propertyValue);
        
        // Save to database
        interactionValue.save(function(err) {
          if (err) {
            console.error(`Error saving interaction for ${deviceId}.${propertyName}:`, err);
          }
        });
      } catch (error) {
        console.error(`Error processing MQTT message from ${topic}:`, error);
      }
    });
    
    client.on('error', (err) => {
      console.error(`MQTT client error for device ${deviceId}:`, err);
    });
    
    // Store client for later use
    subscriptions.set(`mqtt:${deviceId}`, client);
  } catch (error) {
    console.error(`Error setting up MQTT subscription for device ${deviceId}:`, error);
  }
}

// Set up HTTP polling for device properties
function setupHttpPolling(deviceId, config) {
  if (!connectors.http) {
    console.error(`HTTP connector not available for device ${deviceId}`);
    return;
  }
  
  // Default polling interval (5 seconds)
  const pollingInterval = parseInt(process.env.HTTP_POLLING_INTERVAL || '5000');
  
  // Create auth headers if needed
  const headers = {};
  if (config.username && config.password) {
    headers.Authorization = 'Basic ' + Buffer.from(
      config.username + ':' + config.password
    ).toString('base64');
  }
  
  // Base URL for HTTP requests
  const baseUrl = `${config.protocol}://${config.connection}:${config.port}`;
  
  // Set up polling for each property
  for (const [propertyName, mapping] of Object.entries(config.mappings)) {
    // Create polling function
    const pollProperty = async () => {
      try {
        const url = mapping.read ? 
          `${baseUrl}/${mapping.read}` : 
          `${baseUrl}/properties/${propertyName}`;
        
        const response = await connectors.http.get(url, { headers });
        
        // Process response data
        let propertyValue;
        if (typeof response.data === 'object') {
          propertyValue = response.data;
        } else {
          propertyValue = { value: response.data };
        }
        
        // Create ThingInteraction
        const interactionValue = new ThingInteraction({
          device: deviceId,
          origen: "physicalDevice",
          interaction: `property.${propertyName}`,
          data: propertyValue
        });
        
        console.log(`Device ${deviceId} property ${propertyName} (via polling):`, propertyValue);
        
        // Save to database
        interactionValue.save(function(err) {
          if (err) {
            console.error(`Error saving interaction for ${deviceId}.${propertyName}:`, err);
          }
        });
      } catch (error) {
        console.error(`Error polling ${deviceId}.${propertyName}:`, error);
      }
    };
    
    // Start polling
    console.log(`Setting up HTTP polling for ${deviceId}.${propertyName} every ${pollingInterval}ms`);
    const intervalId = setInterval(pollProperty, pollingInterval);
    
    // Store interval for later cleanup
    subscriptions.set(`http:${deviceId}:${propertyName}`, intervalId);
    
    // Also poll immediately
    pollProperty();
  }
}

// Execute user interactions
async function executeInteractions() {
  console.log('Setting up handler for user interactions...');
  
  // Watch for changes in ThingInteraction collection where origin is "user"
  ThingInteraction.watch([{
    $match: { "fullDocument.origen": "user" }
  }]).on('change', async change => {
    try {
      // Get the interaction details
      const interaction = new ThingInteraction(change.fullDocument);
      const deviceId = interaction.device;
      
      // Find device configuration
      const deviceConfig = deviceConnections.get(deviceId);
      if (!deviceConfig) {
        console.error(`No configuration found for device ${deviceId}`);
        return;
      }
      
      console.log(`Processing user interaction: ${interaction.interaction} for device ${deviceId}`);
      
      // Extract interaction type and name
      const parts = interaction.interaction.split('.');
      if (parts.length !== 2) {
        console.error(`Invalid interaction format: ${interaction.interaction}`);
        return;
      }
      
      const [interactionType, interactionName] = parts;
      
      // Execute interaction based on protocol
      switch (deviceConfig.protocol) {
        case 'knx':
          await executeKnxInteraction(deviceConfig, interactionType, interactionName, interaction.data);
          break;
          
        case 'mqtt':
        case 'mqtts':
          await executeMqttInteraction(deviceConfig, interactionType, interactionName, interaction.data);
          break;
          
        case 'http':
        case 'https':
          await executeHttpInteraction(deviceConfig, interactionType, interactionName, interaction.data);
          break;
          
        default:
          console.warn(`Unsupported protocol ${deviceConfig.protocol} for executing interactions`);
      }
    } catch (error) {
      console.error('Error executing interaction:', error);
    }
  });
}

// Execute KNX interaction
async function executeKnxInteraction(deviceConfig, interactionType, interactionName, data) {
  if (!connectors.knx) {
    console.error('KNX connector not available');
    return;
  }
  
  // Look for mapping
  const mapping = deviceConfig.mappings[interactionName];
  if (!mapping || !mapping.write) {
    console.error(`No mapping found for ${interactionName} on device ${deviceConfig.id}`);
    return;
  }
  
  // Extract value based on data type
  let value;
  if (mapping.dataType === 'DPT1.001') {
    value = data.value;
  } else if (mapping.dataType === 'DPT5.001') {
    value = data.brightness;
  } else {
    value = data.value !== undefined ? data.value : data;
  }
  
  try {
    // Send KNX request
    await connectors.knx.sendRequest(
      deviceConfig.connection,
      { requestType: "write", group: mapping.write, dataType: mapping.dataType },
      value
    );
    
    console.log(`Sent KNX command to ${deviceConfig.id}.${interactionName}:`, value);
  } catch (error) {
    console.error(`Error sending KNX command to ${deviceConfig.id}.${interactionName}:`, error);
  }
}

// Execute MQTT interaction
async function executeMqttInteraction(deviceConfig, interactionType, interactionName, data) {
  // Get MQTT client for this device
  const client = subscriptions.get(`mqtt:${deviceConfig.id}`);
  
  if (!client) {
    console.error(`No MQTT client found for device ${deviceConfig.id}`);
    return;
  }
  
  try {
    // Determine topic
    let topic;
    if (deviceConfig.mappings && deviceConfig.mappings[interactionName] && deviceConfig.mappings[interactionName].write) {
      topic = deviceConfig.mappings[interactionName].write;
    } else {
      topic = `${deviceConfig.id}/${interactionType}s/${interactionName}/set`;
    }
    
    // Publish message
    client.publish(topic, JSON.stringify(data), (err) => {
      if (err) {
        console.error(`Error publishing MQTT message to ${topic}:`, err);
      } else {
        console.log(`Published MQTT message to ${topic}:`, data);
      }
    });
  } catch (error) {
    console.error(`Error executing MQTT interaction for ${deviceConfig.id}.${interactionName}:`, error);
  }
}

// Execute HTTP interaction
async function executeHttpInteraction(deviceConfig, interactionType, interactionName, data) {
  if (!connectors.http) {
    console.error('HTTP connector not available');
    return;
  }
  
  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (deviceConfig.username && deviceConfig.password) {
      headers.Authorization = 'Basic ' + Buffer.from(
        deviceConfig.username + ':' + deviceConfig.password
      ).toString('base64');
    }
    
    // Determine URL
    const baseUrl = `${deviceConfig.protocol}://${deviceConfig.connection}:${deviceConfig.port}`;
    let path;
    
    if (deviceConfig.mappings && deviceConfig.mappings[interactionName] && deviceConfig.mappings[interactionName].write) {
      path = deviceConfig.mappings[interactionName].write;
    } else {
      path = `/${interactionType}s/${interactionName}`;
    }
    
    const url = `${baseUrl}${path}`;
    
    // Send request based on interaction type
    if (interactionType === 'property') {
      await connectors.http.put(url, data, { headers });
      console.log(`Sent HTTP PUT to ${url}:`, data);
    } else if (interactionType === 'action') {
      await connectors.http.post(url, data, { headers });
      console.log(`Sent HTTP POST to ${url}:`, data);
    } else {
      console.warn(`Unknown interaction type: ${interactionType}`);
    }
  } catch (error) {
    console.error(`Error executing HTTP interaction for ${deviceConfig.id}.${interactionName}:`, error);
  }
}

// Initialize the service
async function init() {
  try {
    console.log('Starting reflection service...');
    
    // Load device configurations
    loadDeviceConfigurations();
    console.log(`Found ${deviceConnections.size} devices`);
    
    // Subscribe to device properties
    await subscribeToDevices();
    
    // Set up handler for user interactions
    await executeInteractions();
    
    console.log('Reflection service started successfully');
  } catch (error) {
    console.error('Error starting reflection service:', error);
    process.exit(1);
  }
}

// Start the service
init();
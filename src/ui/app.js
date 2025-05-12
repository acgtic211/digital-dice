const express = require('express');
const path = require('path');
const containerCardComponent = require('./components/containerCard');
const switchComponent = require('./components/switch');
const dimmerComponent = require('./components/dimmer');
const colorLightComponent = require('./components/colorLight');

const spdy = require('spdy');
const fs = require('fs');

const app = express();

// Add middleware for JSON parsing
app.use(express.json());

// Servir archivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Define constants
const API_HOST = "https://localhost:30001";
const SUITCASE_API_PATH = "acg:lab:suitcase-dd";
// Cambiar esto para usar el path sin codificar
const SUITCASE_API_URL = `${API_HOST}/${SUITCASE_API_PATH}`;
const CONTAINERS_API_PATH = "acg:lab:virtual-containers";
// Cambiar esto para usar el path sin codificar
const CONTAINERS_API_URL = `${API_HOST}/${CONTAINERS_API_PATH}`;

// Helper function to build proper API endpoints
function buildPropertyUrl(baseUrl, property) {
  return `${baseUrl}/property/${property}`;
}

function buildActionUrl(baseUrl, action) {
  return `${baseUrl}/action/${action}`;
}

// Ruta principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Digital Dice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #333;
          }
          .menu {
            margin-top: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          a.menu-item {
            display: block;
            padding: 15px 30px;
            margin: 10px 0;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            width: 250px;
            text-align: center;
            transition: background-color 0.3s;
          }
          a.menu-item:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <h1>Digital Dice Interface</h1>
        <div class="menu">
          <a href="/suitcase" class="menu-item">Suitcase Controls</a>
          <a href="/containers" class="menu-item">Containers Dashboard</a>
          <a href="/colorlight" class="menu-item">Smart Color Light</a>
          <a href="/api-test" class="menu-item">API Testing</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/colorlight', (req, res) => {
  const lightId = req.query.id || "colorlight_1:acg:lab";
  const baseUrl = req.query.baseUrl || "http://localhost:8063";
  
  // Usar el componente ColorLight
  const component = colorLightComponent(lightId, baseUrl);
  
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart Color Light Control</title>
        <link rel="stylesheet" type="text/css" href="/css/colorLight.css">
      </head>
      <body>
        <div class="page-header">
          <h1>Smart Color Light Control</h1>
        </div>
        ${component}
        <div class="back-link">
          <a href="/">Back to Home</a>
        </div>
      </body>
    </html>
  `);
});


// Actualizar la ruta /switch
app.get('/switch', (req, res) => {
  const switchLabel = req.query.label || "SWITCH 2";
  const componentId = req.query.component || "light2";
  const imageSrc = `/assets/${req.query.image || "WaterSwitch.png"}`;
  const action = `switch-${componentId}`;
  const property = `status-${componentId}`;
  
  // Usar la función del componente Switch con parámetros explícitos
  const component = switchComponent(switchLabel, SUITCASE_API_URL, action, property, imageSrc);
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="/css/switch.css">
      </head>
      <body>
        ${component}
      </body>
    </html>
  `);
});

// Actualizar la ruta /dimmer
app.get('/dimmer', (req, res) => {
  const knobLabel = req.query.label || "KNOB 1";
  const componentId = req.query.component || "dimmer1";
  const action = `switch-${componentId}`;
  const property = `luminosity-${componentId}`;
  
  // Usar la función del componente Dimmer con API URL
  const component = dimmerComponent(knobLabel, SUITCASE_API_URL, action, property);
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="/css/dimmer.css">
      </head>
      <body>
        ${component}
      </body>
    </html>
  `);
});

// Actualizar la ruta /suitcase
app.get('/suitcase', (req, res) => {
  const requestUrl = SUITCASE_API_URL; // Use constant for API base URL

  // Ahora especificamos explícitamente action y property para cada componente
  const switch1 = switchComponent("SWITCH 1", requestUrl, "switch-light1", "status-light1", "/assets/Switch1.png");
  const switch2 = switchComponent("SWITCH 2", requestUrl, "switch-light2", "status-light2", "/assets/Switch2.png");
  const switchFire = switchComponent("FIRE SWITCH", requestUrl, "switch-fire", "status-fire", "/assets/Fireswitch.png");
  const switchWater = switchComponent("WATER SWITCH", requestUrl, "switch-water", "status-water", "/assets/WaterSwitch.png");

  // También para los dimmers, especificar action y property explícitamente
  const dimmer1 = dimmerComponent("DIMMER 1", requestUrl, "switch-dimmer1", "luminosity-dimmer1");
  const dimmer2 = dimmerComponent("DIMMER 2", requestUrl, "switch-dimmer2", "luminosity-dimmer2");
  
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Digital Dice Suitcase</title>
        <link rel="stylesheet" type="text/css" href="/css/switch.css">  
        <link rel="stylesheet" type="text/css" href="/css/dimmer.css">  
        <link rel="stylesheet" type="text/css" href="/css/suitcase.css">
        <style>
          /* Estilos adicionales para los indicadores de estado */
          .switch-status.status-updated, .dimmer-status.status-updated {
            animation: flash-update 0.3s ease;
          }
          
          @keyframes flash-update {
            0% { background-color: rgba(53, 188, 122, 0.2); }
            50% { background-color: rgba(53, 188, 122, 0.8); }
            100% { background-color: transparent; }
          }
          
          .status-offline {
            opacity: 0.8;
            color: #777 !important;
          }
        </style>
      </head>
      <body>
        <div class="suitcaseContainer">
          <h1>Digital Dice Suitcase Controls</h1>
          <div class="knxScenarioContainer">
            <div class="switchesContainer">
              <div class="switchC">${switch1}</div>
              <div class="switchC">${switch2}</div>
              <div class="switchC">${switchFire}</div>
              <div class="switchC">${switchWater}</div>
            </div>
            <div class="slidersContainer">
              ${dimmer1}
              ${dimmer2}
            </div>
          </div>
          <div class="backLink">
            <a href="/">Back to Home</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/containers', async (req, res) => {
  try {
    // Obtener contenedores desde la API externa
    const response = await fetch(`${CONTAINERS_API_URL}/containers`);
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const containersData = await response.json();
    
    // Datos de respaldo por si no se encuentran contenedores
    const containers = containersData.length > 0 ? containersData : [
      {
        serialNumber: "1",
        capacity: 696.00,
        maxCapacity: 700,
        address: "Universidad Almeria-Al Norte",
        temperature: 24,
        garbageClass: "organic",
        expanded: false
      },
      {
        serialNumber: "2",
        capacity: 550.00,
        maxCapacity: 700,
        address: "Calle Principal 123",
        temperature: 22,
        garbageClass: "paper",
        expanded: false
      },
      {
        serialNumber: "3",
        capacity: 2000.00,
        maxCapacity: 900,
        address: "Calle Secundaria 456",
        temperature: 10,
        garbageClass: "plastic",
        expanded: false
      },
    ];
    
    // Generar tarjetas de contenedores
    const containerCards = containers.map(container => 
      `<div class="container-wrapper" style="margin-right: 50px;">${containerCardComponent(container)}</div>`
    ).join('');
    
    res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" type="text/css" href="/css/containerCard.css">
          <title>Container List</title>
        </head>
        <body style="background-color: #f0f0f0; font-family: Arial, sans-serif; margin: 0; padding: 0;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h1 style="text-align: center; margin: 20px 0;">Containers List</h1>
            <div class="containers-grid">
              ${containerCards}
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="/" style="color: #333; text-decoration: none;">Back to Home</a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error fetching containers:", error);
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
        </head>
        <body>
          <h1>Error fetching containers</h1>
          <p>There was a problem connecting to the API. Please try again later.</p>
          <p>Error details: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Actualiza la ruta para contenedor individual para usar la API externa
app.get('/container/:serialNumber', async (req, res) => {
  try {
    const serialNumber = req.params.serialNumber;
    
    // Obtener contenedor desde la API externa
    const response = await fetch(`${CONTAINERS_API_URL}/container/${serialNumber}`);
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const containerData = await response.json();
    
    // Datos de respaldo si el contenedor está vacío
    const container = containerData && Object.keys(containerData).length > 0 ? containerData : {
      serialNumber: serialNumber,
      capacity: 696.00,
      maxCapacity: 700,
      address: "Universidad Almeria-Al Norte",
      temperature: 24,
      garbageClass: "recycling",
      expanded: false
    };
    
    const component = containerCardComponent(container);
    res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" type="text/css" href="/css/containerCard.css">
        </head>
        <body style="background-color: #f0f0f0; font-family: Arial, sans-serif; padding: 20px;">
          <div class="container-wrapper">
            ${component}
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="/containers" style="color: #333; text-decoration: none;">Back to Containers</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error fetching container:", error);
    res.status(500).send("Error fetching container data");
  }
});

// Add to your API testing route
app.get('/api-test', (req, res) => {
  // Construir URLs correctas para pruebas
  const statusLight1Url = buildPropertyUrl(SUITCASE_API_URL, 'status-light1');
  const luminosityDimmer1Url = buildPropertyUrl(SUITCASE_API_URL, 'luminosity-dimmer1');
  
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Testing Interface</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
          }
          h1, h2 {
            color: #333;
          }
          .test-section {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .test-btn {
            display: inline-block;
            padding: 10px 15px;
            margin: 5px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            text-decoration: none;
          }
          .test-btn:hover {
            background-color: #45a049;
          }
          .result {
            margin-top: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fff;
            white-space: pre-wrap;
            font-family: monospace;
            height: 200px;
            overflow: auto;
          }
          .debug-links {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <h1>API Testing Interface</h1>
        
        <div class="test-section">
          <h2>Switch Test - Light 1</h2>
          <button class="test-btn" onclick="testAPI('${SUITCASE_API_URL}/property/status-light1', 'result1')">Test GET status</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-light1', {value: true}, 'result1')">Turn ON</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-light1', {value: false}, 'result1')">Turn OFF</button>
          <a href="/test-sse?url=${encodeURIComponent(SUITCASE_API_URL+'/property/status-light1/sse')}" target="_blank" class="test-btn">Test SSE</a>
          <div id="result1" class="result">Results will appear here...</div>
        </div>

        <div class="test-section">
          <h2>Switch Test - Light 2</h2>
          <button class="test-btn" onclick="testAPI('${SUITCASE_API_URL}/property/status-light2', 'result2')">Test GET status</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-light2', {value: true}, 'result2')">Turn ON</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-light2', {value: false}, 'result2')">Turn OFF</button>
          <a href="/test-sse?url=${encodeURIComponent(SUITCASE_API_URL+'/property/status-light2/sse')}" target="_blank" class="test-btn">Test SSE</a>
          <div id="result2" class="result">Results will appear here...</div>
        </div>
        
        <div class="test-section">
          <h2>Dimmer Test</h2>
          <button class="test-btn" onclick="testAPI('${SUITCASE_API_URL}/property/luminosity-dimmer1', 'result3')">Test GET luminosity</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-dimmer1', {brightness: 20}, 'result3')">Set 20%</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-dimmer1', {brightness: 50}, 'result3')">Set 50%</button>
          <button class="test-btn" onclick="testAction('${SUITCASE_API_URL}/action/switch-dimmer1', {brightness: 100}, 'result3')">Set 100%</button>
          <a href="/test-sse?url=${encodeURIComponent(SUITCASE_API_URL+'/property/luminosity-dimmer1/sse')}" target="_blank" class="test-btn">Test SSE</a>
          <div id="result3" class="result">Results will appear here...</div>
        </div>
        
        <div class="test-section">
          <h2>Debug Tools</h2>
          <p>Use these tools to directly inspect raw API responses:</p>
          
          <div class="debug-links">
            <a href="/debug-response?url=${encodeURIComponent(statusLight1Url)}" target="_blank" class="test-btn">Debug Switch 1 Response</a>
            <a href="/debug-response?url=${encodeURIComponent(luminosityDimmer1Url)}" target="_blank" class="test-btn">Debug Dimmer 1 Response</a>
            <a href="/debug-response?url=${encodeURIComponent(API_HOST + '/' + SUITCASE_API_PATH + '/property/status-light1')}" target="_blank" class="test-btn">Debug Unencoded URL Response</a>
          </div>
          
          <div style="margin-top: 15px">
            <a href="/" class="test-btn">Back to Home</a>
          </div>
        </div>
        
        <script>
          function testAPI(url, resultId) {
            const resultDiv = document.getElementById(resultId);
            resultDiv.innerHTML = 'Fetching data from: ' + url;
            
            fetch(url)
              .then(response => {
                // Guardar el código de estado para mostrarlo
                const statusCode = response.status;
                if (!response.ok) {
                  throw new Error('Network response was not ok: ' + statusCode);
                }
                
                // Clonar la respuesta para mostrar el contenido bruto
                return response.clone().text().then(rawText => {
                  resultDiv.innerHTML = 'SUCCESS (HTTP ' + statusCode + ')!\\n\\nRaw Response: ' + 
                                       (rawText || '(empty response)') + '\\n\\nAttempting to parse as JSON...';
                  
                  try {
                    // Intentar analizar como JSON solo si hay contenido
                    if (rawText && rawText.trim()) {
                      return response.json().then(data => {
                        resultDiv.innerHTML += '\\n\\nParsed JSON:\\n' + JSON.stringify(data, null, 2);
                      });
                    } else {
                      resultDiv.innerHTML += '\\n\\nNo JSON content to parse.';
                    }
                  } catch (jsonError) {
                    resultDiv.innerHTML += '\\n\\nCould not parse as JSON: ' + jsonError.message;
                  }
                });
              })
              .catch(error => {
                resultDiv.innerHTML = 'ERROR! ' + error.message;
                console.error('Error testing API:', error);
              });
          }
          
          function testAction(url, data, resultId) {
            const resultDiv = document.getElementById(resultId);
            resultDiv.innerHTML = 'Sending request to: ' + url + '\\nData: ' + JSON.stringify(data);
            
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              // Guardar el código de estado para mostrarlo
              const statusCode = response.status;
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + statusCode);
              }
              
              // Clonar la respuesta para mostrar el contenido bruto
              return response.clone().text().then(rawText => {
                resultDiv.innerHTML = 'SUCCESS (HTTP ' + statusCode + ')!\\n\\nRaw Response: ' + 
                                     (rawText || '(empty response)') + '\\n\\nAttempting to parse as JSON...';
                
                try {
                  // Intentar analizar como JSON solo si hay contenido
                  if (rawText && rawText.trim()) {
                    return response.json().then(data => {
                      resultDiv.innerHTML += '\\n\\nParsed JSON:\\n' + JSON.stringify(data, null, 2);
                    });
                  } else {
                    resultDiv.innerHTML += '\\n\\nNo JSON content to parse.';
                  }
                } catch (jsonError) {
                  resultDiv.innerHTML += '\\n\\nCould not parse as JSON: ' + jsonError.message;
                }
              });
            })
            .catch(error => {
              resultDiv.innerHTML = 'ERROR! ' + error.message;
              console.error('Error submitting action:', error);
            });
          }
        </script>
      </body>
    </html>
  `);
});

// Actualizar esta ruta para usar URL sin codificar
app.get('/test-endpoint', (req, res) => {
  const endpoint = req.query.endpoint || "status-light1";
  const type = req.query.type || "property"; // property o action
  const url = `${SUITCASE_API_URL}/${type}/${endpoint}`;
  
  console.log(`Testing endpoint: ${url}`);
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      res.json({ 
        success: true, 
        endpoint: url,
        data: data 
      });
    })
    .catch(error => {
      res.status(500).json({ 
        success: false, 
        endpoint: url,
        error: error.message 
      });
    });
});

// Añadir esta ruta para hacer debug de las respuestas
app.get('/debug-response', (req, res) => {
  const url = req.query.url || `${SUITCASE_API_URL}/property/status-light1`;
  
  console.log(`Debugging response from: ${url}`);
  
  fetch(url)
    .then(response => {
      return response.text().then(text => {
        res.send(`
          <html>
            <head>
              <title>API Response Debug</title>
              <style>
                body { font-family: monospace; padding: 20px; }
                .debug-section { margin: 20px 0; padding: 10px; border: 1px solid #ccc; }
                .response-text { white-space: pre-wrap; word-break: break-all; }
                .success { color: green; }
                .error { color: red; }
              </style>
            </head>
            <body>
              <h1>API Response Debug</h1>
              
              <div class="debug-section">
                <h2>Request Details:</h2>
                <div>URL: ${url}</div>
                <div>Status: ${response.status} ${response.statusText}</div>
                <div>Content-Type: ${response.headers.get('content-type') || 'Not specified'}</div>
              </div>
              
              <div class="debug-section">
                <h2>Response Body (Raw):</h2>
                <div class="response-text">${text || '(empty response)'}</div>
              </div>
              
              <div class="debug-section">
                <h2>JSON Parsing Result:</h2>
                <div class="response-text" id="json-result">Attempting to parse JSON...</div>
              </div>
              
              <script>
                try {
                  const text = '${text.replace(/'/g, "\\'")}';
                  if (text && text.trim()) {
                    const json = JSON.parse(text);
                    document.getElementById('json-result').innerHTML = 
                      '<span class="success">Successfully parsed:</span><br>' + 
                      JSON.stringify(json, null, 2);
                  } else {
                    document.getElementById('json-result').innerHTML = 
                      '<span class="error">Cannot parse: Response is empty</span>';
                  }
                } catch (e) {
                  document.getElementById('json-result').innerHTML = 
                    '<span class="error">Failed to parse JSON: ' + e.message + '</span>';
                }
              </script>
              
              <div>
                <a href="/api-test">Back to API Testing</a>
              </div>
            </body>
          </html>
        `);
      });
    })
    .catch(error => {
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error fetching URL</h1>
            <p>${error.message}</p>
            <div><a href="/api-test">Back to API Testing</a></div>
          </body>
        </html>
      `);
    });
});

// Inicia el servidor HTTPS
spdy.createServer(
  {
    key: fs.readFileSync("/app/certs/privkey.pem"),
    cert: fs.readFileSync("/app/certs/fullchain.pem")
  },
  app
).listen(process.env.PORT_UI || 3000, (err) => {
  if(err){
    throw new Error(err);
  }
  console.log("Listening on port " + (process.env.PORT_UI || 3000));
});
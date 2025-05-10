const express = require('express');
const path = require('path');
const switchComponent = require('./components/switch');
const dimmerComponent = require('./components/dimmer');

const app = express();

// Servir archivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a la interfaz de microservicios</h1>');
});

// Ruta para el componente Switch (con un label y acción DELETE personalizada)
app.get('/switch', (req, res) => {
  const switchLabel = "SWITCH 2";
  const requestUrl = "a"; // URL para hacer la petición
  const imageSrc = "/assets/WaterSwitch.png";  // Imagen para el switch
  const action = "switch-light2";
  // Usar la función del componente Switch
  const component = switchComponent(switchLabel, requestUrl, action, imageSrc);
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/switch.css">  <!-- Incluir la hoja de estilos -->
      </head>
      <body>
        ${component}
      </body>
    </html>
  `);
});

// Ruta para el componente Dimmer (con acción POST personalizada)
app.get('/dimmer', (req, res) => {
  const knobLabel = "KNOB 1";
  const requestUrl = "a"; // URL para hacer la petición
  const property = "status-light1";
  
  // Usar la función del componente Dimmer
  const component = dimmerComponent(knobLabel, requestUrl, property);
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/dimmer.css">  <!-- Incluir la hoja de estilos -->
      </head>
      <body>
        ${component}
      </body>
    </html>
  `);
});

// Ruta para mostrar múltiples componentes
app.get('/multiple-components', (req, res) => {
  const requestUrl = "a"; // URL para hacer la petición

  const switch1 = switchComponent("SWITCH 1", requestUrl, "switch-light1", "/assets/Switch1.png");
  const switch2 = switchComponent("SWITCH 2", requestUrl, "switch-light2", "/assets/Switch2.png");
  const switchFire = switchComponent("FIRE SWITCH", requestUrl, "switch-fire", "/assets/Fireswitch.png");
  const switchWater = switchComponent("WATER SWITCH", requestUrl, "switch-water", "/assets/WaterSwitch.png");

  const dimmer1 = dimmerComponent("DIMMER 1", requestUrl, "switch-dimmer1", "luminosity-dimmer1");
  const dimmer2 = dimmerComponent("DIMMER 2", requestUrl, "switch-dimmer2", "luminosity-dimmer2");
  
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/switch.css">  
        <link rel="stylesheet" type="text/css" href="/css/dimmer.css">  
        <link rel="stylesheet" type="text/css" href="/css/suitcase.css"> 
      </head>
      <body>
        <div class="suitcaseContainer">
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
        </div>
      </body>
    </html>
  `);
});


spdy.createServer(
  {
      key: fs.readFileSync("/usr/src/app/certs/privkey.pem"),
      cert: fs.readFileSync("/usr/src/app/certs/fullchain.pem")
  },
  app
).listen(process.env.PORT_UI, (err) => {
  if(err){
    throw new Error(err)
  }
  console.log("Listening on port "+ process.env.PORT_UI)
})

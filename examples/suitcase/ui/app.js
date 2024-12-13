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
  const requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd/"; // URL para hacer la petición
  const imageSrc = "/assets/WaterSwitch.png";  // Imagen para el switch
  const property = "status-light2";
  // Usar la función del componente Switch
  const component = switchComponent(switchLabel, requestUrl, property, imageSrc);
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
  const requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd/"; // URL para hacer la petición
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
  const requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd/"; // URL para hacer la petición

  const switch1 = switchComponent("SWITCH 1", requestUrl, "status-light1", "/assets/Switch1.png");
  const switch2 = switchComponent("SWITCH 2", requestUrl, "status-light2", "/assets/Switch2.png");
  const switchFire = switchComponent("FIRE SWITCH", requestUrl, "status-light1", "/assets/Fireswitch.png");
  const switchWater = switchComponent("WATER SWITCH", requestUrl, "status-light1", "/assets/WaterSwitch.png");

  const dimmerHTML = dimmerComponent("dimmerUrl");
  
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/switch.css">  
        <link rel="stylesheet" type="text/css" href="/css/dimmer.css">  
      </head>
      <body>
        ${switch1}
        ${switch2}
        ${switchFire}
        ${switchWater}
        ${dimmerHTML}
      </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});

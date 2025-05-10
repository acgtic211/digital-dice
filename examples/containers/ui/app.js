const express = require('express');
const path = require('path');
const http = require('http');
const switchComponent = require('./components/containers');

const app = express();

// Servir archivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const requestUrl = "a"; // URL para hacer la petición

  const switch1 = switchComponent();
  
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/containers.css">  
      </head>
      <body>
         ${switch1}
      </body>
    </html>
  `);
});


http.createServer(app).listen(3000, (err) => {
  if (err) {
    throw new Error(err);
  }
  console.log("Listening on port " + 3000);
});

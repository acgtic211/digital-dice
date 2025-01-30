const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');
const td = require('./tdLoader');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('common'));

// Middleware to select virtualizer by @type and customize routes by td.id
app.use((req, res, next) => {
  const type = td['@type'];
  const tdId = td.id;

  if (!type || !tdId) {
    return res.status(400).send({ error: "Missing @type or id in TD" });
  }

  const handlerPath = path.join(__dirname, 'virtualizers', `${tdId}.js`);
  try {
    const handler = require(handlerPath);
    app.use(`/${tdId}`, handler); // Personalizar las rutas con el td.id
    next();
  } catch (err) {
    console.error(`Error loading handler for td.id: ${tdId}`, err);
    res.status(400).send({ error: `Unknown td.id: ${tdId}` });
  }
});

// Configuración de HTTPS
const port = process.env.PORT || 8065;
https
  .createServer(
    {
      key: fs.readFileSync("/app/certs/privkey.pem"),
      cert: fs.readFileSync("/app/certs/fullchain.pem"),
    },
    app
  )
  .listen(port, (err) => {
    if (err) {
      console.error("Error starting server:", err);
      return;
    }
    console.log(`Listening on port ${port}`);
  });
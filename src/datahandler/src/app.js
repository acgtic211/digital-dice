const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const promBundle = require("express-prom-bundle");
const fs = require("fs");
const cors = require('cors');
const metricsMiddleware = promBundle({includeMethod: true});

const spdy = require("spdy");

const routes = require("./routes");

dotenv.config();

// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(express.text(), express.json())

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

app.use(metricsMiddleware);

// Apply logs template to express
app.use(morgan('common'));

app.use("/", routes);

// Initializates the Webserver
spdy.createServer(
    {
        key: fs.readFileSync("/app/certs/privkey.pem"),
        cert: fs.readFileSync("/app/certs/fullchain.pem")
    },
    app
  ).listen(8063, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ 8063)
})
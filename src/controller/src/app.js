const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const promBundle = require("express-prom-bundle");
const fs = require("fs");
const metricsMiddleware = promBundle({ includeMethod: true });
const https = require("https");
const http = require("http");
const td = require('./tdLinkLoader');
const routes = require("./routes");

dotenv.config();

// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(express.text(), express.json());

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

app.use(metricsMiddleware);

// Apply logs template to express
app.use(morgan("common"));

app.use("/", routes);

app.listen(process.env.PORT2_CONTROLLER, () => {
  console.log("Controller listening on port ", process.env.PORT2_CONTROLLER);
});

https
  .createServer(
    {
      key: fs.readFileSync("/app/certs/privkey.pem"),
      cert: fs.readFileSync("/app/certs/fullchain.pem"),
    },
    app
  )
  .listen(process.env.PORT_CONTROLLER, (err) => {
    if (err) {
      throw new Error(err);
    }
    console.log("Listening on port " + process.env.PORT_CONTROLLER);
  });

const options = {
  hostname: "acg.ual.es",
  path: "/projects/cosmart/wot-lab/ds/",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on("data", (d) => {
    process.stdout.write(d);
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(JSON.stringify(td));
req.end();
const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const promBundle = require("express-prom-bundle");
const fs = require("fs");
const metricsMiddleware = promBundle({ includeMethod: true });
const http2 = require("http2");
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

app.listen(80, () => {
  console.log("Controller listening on port ", 80);
});

http2
  .createSecureServer(
    {
      key: fs.readFileSync("/app/certs/privkey.pem"),
      cert: fs.readFileSync("/app/certs/fullchain.pem"),
      allowHTTP1: true
    },
    app
  )
  .listen(443, (err) => {
    if (err) {
      throw new Error(err);
    }
    console.log("Listening on port " + 443);
  });


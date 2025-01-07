const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const promBundle = require("express-prom-bundle");
const fs = require("fs");
const path = require('path');
const metricsMiddleware = promBundle({ includeMethod: true });
const http = require("http");
const Ajv = require("ajv");

const routes = require("./routes");
const swaggerConfig = require("./swaggerConfig");

dotenv.config();

// Ruta al archivo JSON
const jsonFilePath = path.join(__dirname, 'td', 'originalTd.json');

// Leer el archivo JSON de manera síncrona
let td;
try {
  const data = fs.readFileSync(jsonFilePath, 'utf8');
  td = JSON.parse(data);
} catch (err) {
  console.error('Error reading or parsing JSON file:', err);
  process.exit(1); // Salir del proceso si hay un error al leer o parsear el archivo JSON
}

const td_schema = require("./td/td_schema");

// Validate TD.
const ajv = new Ajv();
const valid = ajv.validate(td_schema, td);
if (!valid) {
  console.log(ajv.errors);
  console.log("La Thing no cumple el esquema de la Thing Description");
  process.exit(1); // Salir del proceso si la validación falla
} else {
  console.log("TD validada");

  td.base = process.env.TD_O_URL;

  td.securityDefinitions = {
    basic_sc: {
      scheme: "basic",
      in: "header",
    },
  };

  td.security = "basic_sc";

  if (td.properties) {
    for (const prop in td.properties) {
      if (td.properties.hasOwnProperty(prop)) {
        td.properties[prop].forms = [
          {
            href: `${td.base}/td.id/properties/${prop}`,
            contentType: "application/json",
            op: ["readproperty", "writeproperty"],
          },
          {
            href: `${td.base}/td.id/properties/${prop}/sse`,
            contentType: "application/json",
            subprotocol: "sse",
            op: ["readproperty"],
          },
        ];
      }
    }
  }

  if (td.actions) {
    for (const action in td.actions) {
      if (td.actions.hasOwnProperty(action)) {
        td.actions[action].forms = [
          {
            href: `${td.base}/td.id/actions/${action}`,
            contentType: "application/json",
            op: ["invokeaction"],
          },
        ];
      }
    }
  }

  if (td.events) {
    for (const event in td.events) {
      if (td.events.hasOwnProperty(event)) {
        td.events[event].forms = [
          {
            href: `${td.base}/td.id/events/${event}`,
            contentType: "application/json",
            op: ["subscribeevent"],
          },
          {
            href: `${td.base}/td.id/events/${event}/sse`,
            contentType: "application/json",
            subprotocol: "sse",
            op: ["subscribeevent"],
          },
        ];
      }
    }
  }

  console.log("TD virtual creado:", td);

  process.env.TD_VIRTUAL = JSON.stringify(td);
}

// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(metricsMiddleware);

// Apply logs template to express
app.use(morgan("common"));

app.use("/", routes);

app.use(
  "/api_docs",
  swaggerConfig.swaggerUi.serve,
  swaggerConfig.swaggerUi.setup(swaggerConfig.openAPISpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: swaggerConfig.td.title,
  })
);
app.get("/openapi.json", (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  res.json(swaggerConfig.openAPISpec);
});

console.log("Swagger UI disponible en /api-docs");
console.log("Esquema OpenAPI disponible en /openapi.json");

app.listen(process.env.PORT2_CONTROLLER, () => {
  console.log("Controller listening on port ", process.env.PORT2_CONTROLLER);
});

http.createServer(app).listen(process.env.PORT_CONTROLLER, (err) => {
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
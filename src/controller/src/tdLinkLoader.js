const fs = require("fs");
const path = require('path');
const Ajv = require("ajv");

// añadir links openapi y thing description virtual (sustituir td original)

const jsonFilePath = path.join('/app/td', 'originalTd.json');

let td;

try {
  // Comprueba si el archivo existe y tiene contenido antes de leerlo
  const stats = fs.statSync(jsonFilePath);

  if (stats.size === 0) {
    console.error('Error: El archivo originalTd.json está vacío (sin texto)');
    process.exit(1);
  }

  const data = fs.readFileSync(jsonFilePath, 'utf8');

  // Verifica si el contenido leído es vacío o solo tiene espacios en blanco
  if (!data || data.trim() === "") {
    console.error('Error: El archivo originalTd.json contiene solo espacios en blanco o está vacío');
    process.exit(1);
  }

  td = JSON.parse(data);

  // Verifica si el objeto JSON está vacío
  if (Object.keys(td).length === 0) {
    console.error('Error: El contenido del TD está vacío');
    process.exit(1);
  }

} catch (err) {
  console.error('Error leyendo o parseando el archivo JSON:', err);
  process.exit(1);
}

// Validación del TD.
if (!td) {
  console.error('Error: El TD es nulo o indefinido');
  process.exit(1);
}

var td_schema = require("./td/td_schema");

// Validate TD.

var ajv = new Ajv();
var valid = ajv.validate(td_schema, td);
if (!valid) {
  console.log(ajv.errors);
  console.log("La Thing no cumple el esquema de la Thing Description");
} else {
  console.log("TD validada");

  td.base = process.env.TD_O_URL;

  td.securityDefinitions = {
    basic_sc: {
      scheme: "basic",
      in: "header",
     }
  };

  td.security = "basic_sc";

  if (td.properties) {
    for (var prop in td.properties) {
      if (td.properties.hasOwnProperty(prop)) {
        td.properties[prop].forms = [
          {
            href: `${td.base}/${td.id}/properties/${prop}`,
            contentType: "application/json",
            op: ["readproperty", "writeproperty"],
          },
          {
            href: `${td.base}/${td.id}/properties/${prop}/sse`,
            contentType: "application/json",
            subprotocol: "sse",
            op: ["readproperty"],
          },
        ];
      }
    }
  }

  if (td.actions) {
    for (var action in td.actions) {
      if (td.actions.hasOwnProperty(action)) {
        td.actions[action].forms = [
          {
            href: `${td.base}/${td.id}/actions/${action}`,
            contentType: "application/json",
            op: ["invokeaction"],
          },
        ];
      }
    }
  }

  if (td.events) {
    for (var event in td.events) {
      if (td.events.hasOwnProperty(event)) {
        td.events[event].forms = [
          {
            href: `${td.base}/${td.id}/events/${event}`,
            contentType: "application/json",
            op: ["subscribeevent"],
          },
          {
            href: `${td.base}/${td.id}/events/${event}/sse`,
            contentType: "application/json",
            subprotocol: "sse",
            op: ["subscribeevent"],
          },
        ];
      }
    }
  }

  td.links = [
    {
      href: `${td.base}/openapi`,
      rel: "openapi",
      type: "application/openapi"
    },
    {
      href: `${td.base}/`,
      rel: "thing-description",
      type: "application/json"
    }
  ];

  console.log("TD virtual creado en variable de entorno TD_VIRTUAL");

  process.env.TD_VIRTUAL = JSON.stringify(td);
}

module.exports = td;
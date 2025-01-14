const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require('path');

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


// Función para convertir TD a OpenAPI
function generateOpenAPI(td) {
  const openAPISpec = {
    openapi: "3.0.0",
    info: {
      title: td.title,
      version: "1.0.0",
      description: `Generated OpenAPI documentation for ${td.title}`,
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  if (td.properties) {
    for (const [key, prop] of Object.entries(td.properties)) {
      const propertyPath = `/${td.id}/property/${key}`;
      openAPISpec.paths[propertyPath] = {
        get: {
          summary: `Get ${key}`,
          responses: {
            200: {
              description: `Property ${key}`,
              content: {
                "application/json": {
                  schema: prop,
                },
              },
            },
          },
        },
        post: {
          summary: `Set ${key}`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: prop,
              },
            },
          },
          responses: {
            200: {
              description: `Property ${key} updated`,
            },
          },
        },
      };
    }
  }

  if (td.actions) {
    for (const [key, action] of Object.entries(td.actions)) {
      const actionPath = `/${td.id}/action/${key}`;
      openAPISpec.paths[actionPath] = {
        post: {
          summary: `Invoke action ${key}`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: action.input || {},
              },
            },
          },
          responses: {
            200: {
              description: `Action ${key} executed`,
            },
          },
        },
      };
    }
  }

  return openAPISpec;
}

const openAPISpec = generateOpenAPI(td);

module.exports = { swaggerUi, openAPISpec, td };
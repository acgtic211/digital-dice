const swaggerUi = require("swagger-ui-express");
const td = require('./tdLoader');

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
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const promBundle = require("express-prom-bundle");
const fs = require("fs")
const metricsMiddleware = promBundle({includeMethod: true});
var http = require('http');
var request = require('request');
const EventSource = require('eventsource');
const spdy = require("spdy");
//const Ajv = require('ajv');
//modificacion 18-11-24
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

var td = require("./td/td");
var td_schema = require("./td/td_schema");

// Validate TD.

/* var ajv = new Ajv();
var valid = ajv.validate(td_schema, td);
if (!valid) {
    console.log(ajv.errors);
    console.log("La Thing no cumple el equema de la Thing Description");
} else {
    console.log("TD validada")
} */

dotenv.config();


// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(bodyParser.json())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use(metricsMiddleware);

// Apply logs template to express
app.use(morgan('common'));


//modificacion 18-11-24
// Función para convertir TD a OpenAPI
function generateOpenAPI(td) {
    const openAPISpec = {
        openapi: '3.0.0',
        info: {
            title: td.title,
            version: '1.0.0',
            description: `Generated OpenAPI documentation for ${td.title}`
        },
        paths: {},
        components: {
            schemas: {}
        }
    };

    // Convertir propiedades de TD a endpoints
    if (td.properties) {
        for (const [key, prop] of Object.entries(td.properties)) {
            const propertyPath = `/${td.id}/property/${key}`;
            openAPISpec.paths[propertyPath] = {
                get: {
                    summary: `Get ${key}`,
                    operationId: `get_${key}`,
                    responses: {
                        200: {
                            description: `Property ${key}`,
                            content: {
                                'application/json': {
                                    schema: prop
                                }
                            }
                        }
                    }
                },
                post: {
                    summary: `Set ${key}`,
                    operationId: `set_${key}`,
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: prop
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: `Property ${key} updated`
                        }
                    }
                }
            };
        }
    }

    // Convertir acciones de TD a endpoints
    if (td.actions) {
        for (const [key, action] of Object.entries(td.actions)) {
            const actionPath = `/${td.id}/action/${key}`;
            openAPISpec.paths[actionPath] = {
                post: {
                    summary: `Invoke action ${key}`,
                    operationId: `invoke_${key}`,
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: action.input
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: `Action ${key} executed`
                        }
                    }
                }
            };
        }
    }

    // Convertir eventos de TD a endpoints (si los hay)
    if (td.events) {
        for (const [key] of Object.entries(td.events)) {
            const eventPath = `/event/${key}`;
            openAPISpec.paths[eventPath] = {
                get: {
                    summary: `Subscribe to event ${key}`,
                    operationId: `subscribe_${key}`,
                    responses: {
                        200: {
                            description: `Subscribed to event ${key}`
                        }
                    }
                }
            };
        }
    }

    return openAPISpec;
}

const openAPISpec = generateOpenAPI(td);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openAPISpec, {
    customCss: '.swagger-ui .topbar { display: none }', 
    customSiteTitle: td.title                           
}));

app.get('/openapi.json', (req, res) => {
    res.json(openAPISpec);
});

console.log("Swagger UI disponible en /api-docs");
console.log("Esquema OpenAPI disponible en /openapi.json");

app.get('/', async (req, res)=>{
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    res.send("It's good to be alive!!!")
});

app.get('/acg:lab:suitcase-dd/status/sse', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    //if(!td.properties[req.params.propertyName]) res.status(404).send("That property doesn't exist");

    console.log("FUNCIONA PLS");
    var eventSourceInitDict = {https: {rejectUnauthorized: false}};
    var es = new EventSource(process.env.DH + ":8063/acg:lab:suitcase-dd/status/sse", eventSourceInitDict);
    //var es = new EventSource("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse", eventSourceInitDict);
    //request("http://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse").pipe(res);

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    es.onmessage = function(event){
        res.write(`data: ${event.data}\n\n`);
    };
    req.on('close', () => {
        console.log(`Connection closed`);
    });

})

app.get('/'+td.id, async (req, res)=>{
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    res.send(td)
});



app.get('/'+td.id+'/property/:propertyName/sse', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    if(!td.properties[req.params.propertyName]) res.status(404).send("That property doesn't exist");

    var eventSourceInitDict = {https: {rejectUnauthorized: false}};
    var es = new EventSource(process.env.DH + ":8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse", eventSourceInitDict);
    //var es = new EventSource("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse", eventSourceInitDict);
    //request("http://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse").pipe(res);

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    es.onmessage = function(event){
        res.write(`data: ${event.data}\n\n`);
    };
    req.on('close', () => {
        console.log(`Connection closed`);
    });

})

app.get('/'+td.id+'/property/:propertyName', async (req, res) => {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    if(!td.properties[req.params.propertyName]) res.status(404).send("That property doesn't exist");

    const headers = {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    request(process.env.DH + ":8063"+"/"+td.id+"/property/"+req.params.propertyName).pipe(res);
    //request("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName).pipe(res);

})

app.post('/'+td.id+'/property/:propertyName', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    if(!td.properties[req.params.propertyName]) res.status(404).send("That property doesn't exist");

    td.properties[req.params.propertyName].required.forEach(element => {
        if(req.body[element] == undefined) res.status(404).send("Some of the necessary properties are not in the request - "+td.properties[req.params.propertyName].required);
    });

    const headers = {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, req.body.value);
    request.post(process.env.DH + ":8063"+"/"+td.id+"/property/"+req.params.propertyName, {"json":req.body}).pipe(res)
    //request.post("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName, {"json":req.body}).pipe(res)


})

app.post('/'+td.id+'/action/:actionName', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    if(!td.actions[req.params.actionName]) res.status(404).send("That action doesn't exist");

    td.actions[req.params.actionName].required.forEach(element => {
        if(req.body[element] == undefined) res.status(404).send("Some of the necessary properties are not in the request - "+td.actions[req.params.actionName].required);
    });

    const headers = {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, req.body.value);

    request.post(process.env.DH + ":8063"+"/"+td.id+"/action/"+req.params.actionName,{"json":req.body}).pipe(res);
    //request.post("https://localhost:8063"+"/"+td.id+"/action/"+req.params.actionName,{"json":req.body}).pipe(res);


})

app.get('/event/:eventName', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    if(!td.actions[req.params.eventName]) res.status(404).send("That event doesn't exist");

    const headers = {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    
    res.redirect(process.env.EH + ":8064"+"/"+td.id+"/event/"+req.params.eventName)


})



app.listen(process.env.PORT2_CONTROLLER, () => {
    console.log('Controller listening on port ', process.env.PORT2_CONTROLLER);
});

spdy.createServer(
    {
        key: fs.readFileSync("/usr/src/app/certs/privkey.pem"),
        cert: fs.readFileSync("/usr/src/app/certs/fullchain.pem")
    },
    app
  ).listen(process.env.PORT_CONTROLLER, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ process.env.PORT_CONTROLLER)
})

const options = {
    hostname: 'acg.ual.es',
    path: '/projects/cosmart/wot-lab/ds/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
}

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
        process.stdout.write(d)
      })
})

req.on('error', error => {
    console.error(error)
  })
  
req.write(JSON.stringify(td))
req.end()


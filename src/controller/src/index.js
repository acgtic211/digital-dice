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

app.get('/', async (req, res)=>{
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    res.send("It's good to be alive!!!")
});

app.get('/acg:lab:suitcase-dd/status/sse', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    //if(!td.properties[req.params.propertyName]) res.status(404).send("That property doesn't exist");

    console.log("FUNCIONA PLS");
    var eventSourceInitDict = {https: {rejectUnauthorized: false}};
    var es = new EventSource("https://dd-suitcase-dh-entrypoint:8063/acg:lab:suitcase-dd/status/sse", eventSourceInitDict);
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
    var es = new EventSource("https://dd-suitcase-dh-entrypoint:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse", eventSourceInitDict);
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

    request("https://dd-suitcase-dh-entrypoint:8063"+"/"+td.id+"/property/"+req.params.propertyName).pipe(res);
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
    request.post("https://dd-suitcase-dh-entrypoint:8063"+"/"+td.id+"/property/"+req.params.propertyName, {"json":req.body}).pipe(res)
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

    request.post("https://dd-suitcase-dh-entrypoint:8063"+"/"+td.id+"/action/"+req.params.actionName,{"json":req.body}).pipe(res);
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
    
    res.redirect("https://dd-suitcase-eh-entrypoint:8064"+"/"+td.id+"/event/"+req.params.eventName)


})



app.listen(process.env.PORT2, () => {
    console.log('Controller listening on port ', process.env.PORT2);
});

spdy.createServer(
    {
        key: fs.readFileSync("./privkey.pem"),
        cert: fs.readFileSync("./fullchain.pem")
    },
    app
  ).listen(process.env.PORT, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ process.env.PORT)
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


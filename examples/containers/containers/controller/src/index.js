const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const promBundle = require("express-prom-bundle");
const fs = require("fs")
const metricsMiddleware = promBundle({includeMethod: true});
//var http = require('http');
var request = require('request');
const EventSource = require('eventsource');
const spdy = require("spdy");


var td = require("./td/WoTContainer_1");
var td_schema = require("./td/td_schema");

dotenv.config();


// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(express.json())

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

app.use(metricsMiddleware);

// Apply logs template to express
app.use(morgan('common'));

app.get('/acg:lab:virtual-containers/td', async (req, res) => {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    res.send(td);

})

//Event fire
app.get('/acg:lab:virtual-containers/events/fire/sse', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    
    var eventSourceInitDict = { https: {rejectUnauthorized: false}};
    var es = new EventSource('https://dd-garbage-containers-eh-entrypoint:443/acg:lab:virtual-containers/events/fire/sse', eventSourceInitDict);
    console.log(es);
    res.writeHead(200, headers);

    es.onmessage = function(event) {
        console.log(JSON.stringify(event.data));
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }
    
    req.on('close', () => {
        console.log("Connection closed");
    });

})


// Details from all containers
app.get('/acg:lab:virtual-containers/property/containersDetails', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    request('https://dd-garbage-containers-dh-entrypoint:443/acg:lab:virtual-containers/property/containersDetails').pipe(res);

});

//Detail from a container
app.get('/acg:lab:virtual-containers/:serialNumber/property/containerDetails', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    request('https://dd-garbage-containers-dh-entrypoint:443/acg:lab:virtual-containers/' + req.params.serialNumber + '/property/containerDetails').pipe(res);

});

//Details from all containers SSE
app.get('/acg:lab:virtual-containers/property/containersDetails/sse', async (req, res) => {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    var eventSourceInitDict = { https: {rejectUnauthorized: false}};
    var es = new EventSource('https://dd-garbage-containers-dh-entrypoint:443/acg:lab:virtual-containers/property/containersDetails/sse', eventSourceInitDict);

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    es.onmessage = function(event) {
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }

    req.on('close', () => {
        console.log("Connection closed");
    });

});

//Detail from a container SSE
app.get('/acg:lab:virtual-containers/:serialNumber/property/containerDetails/sse', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    var eventSourceInitDict = { https: {rejectUnauthorized: false}};
    var es = new EventSource('https://dd-garbage-containers-dh-entrypoint:443/acg:lab:virtual-containers/' + req.params.serialNumber + '/property/containerDetails/sse', eventSourceInitDict);
    
    es.onmessage = function(event) {
        console.log(JSON.stringify(event.data));
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }
    
    req.on('close', () => {
        console.log("Connection closed");
    });

});


app.put('/acg:lab:virtual-containers/:serialNumber/actions/:actionName', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    if(!td.actions[req.params.actionName]) res.status(400).send("That action doesnt exist");

    if(td.actions[req.params.actionName].required){
        td.actions[req.params.actionName].required.forEach(element => {
            if(req.body[element] == undefined) res.status(404).send("Some of the necessary properties are not in the request - " + td.actions[req.params.actionName].required);
        });
    }

    request.put('https://dd-garbage-containers-dh-entrypoint:443/acg:lab:virtual-containers/' + req.params.serialNumber + '/action/' + req.params.actionName, {"json": req.body }).pipe(res);

});

app.put('/acg:lab:virtual-containers/runApp', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    request.put('https://dd-garbage-containers-virtualizer-entrypoint:443/containers/runApp').pipe(res);
});


spdy.createServer(
    {
      key: fs.readFileSync("./server.key"),
      cert: fs.readFileSync("./server.crt")
    },
    app
  ).listen(process.env.PORT, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ process.env.PORT)
})
/*
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
req.end()*/


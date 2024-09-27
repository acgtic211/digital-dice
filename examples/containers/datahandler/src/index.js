const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const promBundle = require("express-prom-bundle");
const fs = require("fs")
const cors = require('cors');
const metricsMiddleware = promBundle({includeMethod: true});

const spdy = require("spdy");

dotenv.config();

// Connect to the mongoDB
const db = require('./config');

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


var thingInteractionSchema = require('./models')

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

// Details from all containers
app.get('/acg:lab:virtual-containers/property/containersDetails', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    var todos = await ThingInteraction.find({device:{ $regex: /acg:lab:virtual-containers:/, $options: 'i' }, origen: "virtualDevice", interaction: "property.containerDetails" , lastInteraction: true});
    var todosData=[]
    await todos.forEach( element=>{
        todosData.push(element.get('data'))
    });
    res.send(todosData);

})

//Detail from a container
app.get('/acg:lab:virtual-containers/:serialNumber/property/containerDetails', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    var uno = await ThingInteraction.findOne({device: 'acg:lab:virtual-containers:' + req.params.serialNumber, origen: "virtualDevice", interaction: "property.containerDetails",lastInteraction: true});

    res.send(uno.get('data'));
});

//Details from all containers SSE
app.get('/acg:lab:virtual-containers/property/containersDetails/sse', async (req, res) => {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    ThingInteraction.watch([{$match: {$and: [ { "fullDocument.device": { $regex: /acg:lab:virtual-containers:/, $options: 'i' }, "fullDocument.lastInteraction": true}, { "fullDocument.origen": "virtualDevice"}, {"fullDocument.interaction": "property.containerDetails" }]}}]).on('change', change => {
        var response = new ThingInteraction(change.fullDocument);
        res.write(`data: ${JSON.stringify(response.data)}\n\n`)
    }
    );

    req.on('close', () => {
        console.log(`Connection closed`);
    });

})

//Detail from a container SSE
app.get('/acg:lab:virtual-containers/:serialNumber/property/containerDetails/sse', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    ThingInteraction.watch([{$match: {$and: [ {"fullDocument.device": 'acg:lab:virtual-containers:'+req.params.serialNumber}, {"fullDocument.lastInteraction": true}, { "fullDocument.origen": "virtualDevice"}, {"fullDocument.interaction": "property.containerDetails" }]}}]).on('change', change => {
        //console.log(change.fullDocument);
        var response = new ThingInteraction(change.fullDocument);
        
        res.write(`data: ${JSON.stringify(response.data)}\n\n`)

    }
    );

    req.on('close', () => {
        console.log(`Connection closed`);
    });

});

//A container´s actions
app.put('/acg:lab:virtual-containers/:serialNumber/action/:actionName', async(req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    var interactionValue = new ThingInteraction({
        device: "acg:lab:virtual-containers:" + req.params.serialNumber,
        origen: "user",
        interaction: "action." + req.params.actionName,
        data: req.body
    });

    interactionValue.save(function (err, doc) {
        if (err) res.status(400).send(err);
        else {;
            res.send(doc.data);
        }
    });

});

// Initializates the Webserver
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
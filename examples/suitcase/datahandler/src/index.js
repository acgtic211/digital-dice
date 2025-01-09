const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const promBundle = require("express-prom-bundle");
const fs = require("fs")
const cors = require('cors');
const Ajv = require('ajv');
const metricsMiddleware = promBundle({includeMethod: true});

const spdy = require("spdy");

var td = require("./td/td");
var td_schema = require("./td/td_schema");

dotenv.config();

// Connect to the mongoDB
const db = require('./config');

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


var thingInteractionSchema = require('./models')

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

var td = require("./td/td");
//var td_schema = require("./td/td_schema");

app.get('/' + td.id + '/status/sse', async (req, res) => {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");

    ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.device": "acg:lab:suitcase-dd" }]}}]).on('change', change => {
        var response = new ThingInteraction(change.fullDocument);
        res.write(`data: ${JSON.stringify(response)}\n\n`)
    });

    req.on('close', () => {
        console.log(`Connection closed`);
    });

})

app.get('/' + td.id + '/property/:propertyName/sse', async (req, res) => {
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.interaction": "property."+req.params.propertyName }]}}]).on('change', change => {
        var response = new ThingInteraction(change.fullDocument);
        res.write(`data: ${JSON.stringify(response.data)}\n\n`)
    }
    );

    req.on('close', () => {
        console.log(`Connection closed`);
    });

})

app.get('/' + td.id + '/property/:propertyName', async (req, res) => {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    ThingInteraction.findOne({ interaction: "property."+req.params.propertyName, origen: "physicalDevice" }, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new ThingInteraction(data);
        res.send(response.data)
    });

})

app.post('/' + td.id + '/property/:propertyName', async (req, res) => {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    var interactionValue = new ThingInteraction({
        device: "acg:lab:suitcase-dd",
        origen: "user",
        interaction: "property." + req.params.propertyName,
        data: req.body
    })

    interactionValue.save(function (err, doc) {
        if (err) res.status(400).send(err);
        else {;
            res.send(doc.data);
        }
    })

})

app.post('/' + td.id + '/action/:actionName', async (req, res) => {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    var interactionValue = new ThingInteraction({
        device: "acg:lab:suitcase-dd",
        origen: "user",
        interaction: "action." + req.params.actionName,
        data: req.body
    })

    interactionValue.save(function (err, doc) {
        if (err) res.status(400).send(err);
        else res.send(doc.data);
    })


})

app.post('/' + td.id + '/event/:eventName', async (req, res) => {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    var interactionValue = new ThingInteraction({
        device: "acg:lab:suitcase-dd",
        origen: "eventHandler",
        interaction: "event." + req.params.eventName,
        data: req.body
    })

    interactionValue.save(function (err, doc) {
        if (err) res.status(400).send(err);
        else res.send(doc.data);
    })


})



// Initializates the Webserver
spdy.createServer(
    {
        key: fs.readFileSync("/usr/src/app/certs/privkey.pem"),
        cert: fs.readFileSync("/usr/src/app/certs/fullchain.pem")
    },
    app
  ).listen(process.env.PORT_DH, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ process.env.PORT_DH)
})
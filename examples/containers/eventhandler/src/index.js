const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const spdy = require("spdy");
const fs = require("fs")
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
app.use(express.json())

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// Apply logs template to express
app.use(morgan('common'));


var thingInteractionSchema = require('./models').thingInteraction;
var ThingInteraction = db.thingConnection.model('ThingInteraction', thingInteractionSchema);

var containerSchema = require('./models').container;
var container = db.containerConnection.model('Container', containerSchema);

app.get('/acg:lab:virtual-containers/events/fire/sse', async (req, res) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    }

    res.writeHead(200, headers);

    ThingInteraction.watch([{$match: {$and: [ { "fullDocument.device": { $regex: /acg:lab:virtual-containers:/, $options: 'i' }}, {"fullDocument.lastInteraction": true}, { "fullDocument.origen": "virtualDevice"}, {"fullDocument.interaction": "event.fire" }]}}]).on('change', change => {
        
        res.write(`data: ${JSON.stringify(change.fullDocument.data)}\n\n`);

    });

    req.on('close', () => {
        console.log('Connection closed');
    })

});

async function effectsControl(){
    var causes=[[]];
    var effectsKeys = Object.keys(td.effects)
    console.log(effectsKeys)
    effectsKeys.forEach((key,effectIndex)=>{
        
            td.effects[key].causes.forEach((cause, causeIndex)=>{
                console.log("CausesIn")
                ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.interaction": cause.interactionType+"."+cause.interaction }]}}]).on('change', async change => {
                    causes[effectIndex][causeIndex]=change.fullDocument;
                    console.log("interaction watched")
                    if(td.effects[key].window){
                        var inWindow = await calcWindow(causes[effectIndex], td.effects[key])
                        console.log(inWindow);
                        if(inWindow) evalExpresion(causes[effectIndex], td.effects[key])
                    }
                })
            });
        });
    
}

async function calcWindow(causes, effect){
    //console.log(causes);
    //console.log(effect);
    if(causes.length == effect.causes.length){
        if(!effect.hasOrder){
            causes.sort((a, b) => {return a.createdAt.getTime()-b.createdAt.getTime()})
        }
        var timeBetween = 0;
        causes.forEach((element,indexElement) => {
            if(indexElement==0);
            else{
                    var auxTime = (element.createdAt.getTime()-causes[indexElement-1].createdAt.getTime())/1000;
                    if(auxTime < 0){
                        timeBetween+= -Infinity;
                    }
                    else{
                        timeBetween+= auxTime;   
                    }  
            } 
        });
        console.log(effect.window);
        console.log(timeBetween);
        if(effect.window-Math.abs(timeBetween)>0 && effect.window-Math.abs(timeBetween)<effect.window) return true;
    }
    return false;

}

async function evalExpresion(causes, effect){
    eval(effect.evalExpression);
}

//effectsControl();

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

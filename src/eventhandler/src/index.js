const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const Ajv = require('ajv');

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

// Apply logs template to express
app.use(morgan('common'));


var thingInteractionSchema = require('./models')

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

//var td_schema = require("./td/td_schema");

app.get('/'+td.title+'/event/:eventName',async (req, res)=>{
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    ThingInteraction.watch({interaction: 'property.status'}).on('change', change => res.write(`data: ${JSON.stringify(change.fullDocument)}\n\n`));;
    
    req.on('close', () => {
        console.log(`Connection closed`);
    });

})
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

6

}

async function evalExpresion(causes, effect){
    eval(effect.evalExpression);
}

effectsControl();

app.listen(process.env.PORT, () => {
    console.debug('App listening on port ' + process.env.PORT);
});

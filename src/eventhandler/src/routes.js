const express = require("express");
const router = express.Router();
const td = require("./tdLoader");

const db = require('./config');

var thingInteractionSchema = require('./models')

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

//var td_schema = require("./td/td_schema");

router.get('/'+td.title+'/event/:eventName',async (req, res)=>{
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

module.exports = router;
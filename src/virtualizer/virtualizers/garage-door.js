const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Creates Web Server
const app = express();

// Cors
app.use(cors());

// parse application/json
app.use(express.json());

// Apply logs template to express
app.use(morgan('common'));

// Garage Door Variables
var status = "CLOSED";
var percentageOpen = 0;

app.get('/', async (req, res)=>{
    res.send("This is a virtual garage door");
});

// Property status
app.get('/property/status', async (req, res)=>{  
    res.send(JSON.parse('{"status":"'+ status +'"}'));
});

app.post('/property/status', async (req, res)=>{  
    status = req.body.status;
    if (req.body.status == "OPEN" || req.body.status == "CLOSED"){
        status = req.body.status;
        res.send(JSON.parse('{"status":"'+ status +'"}'));
    }else{
        res.send(JSON.parse('{"error": "invalid status"}'));
        return;
    }
});

// Property percentageOpen
app.get('/property/percentageOpen', async (req, res)=>{  
    res.send(JSON.parse('{"percentageOpen":'+ percentageOpen +'}'));
});

app.post('/property/percentageOpen', async (req, res)=>{  
    if (req.body.percentageOpen >= 0 && req.body.percentageOpen <= 100){
        percentageOpen = req.body.percentageOpen;
        res.send(JSON.parse('{"percentageOpen":'+ percentageOpen +'}'));
        if (req.body.percentageOpen == 0){
            status = "CLOSED";
        }else{
            status = "OPEN";
        }
    }else{
        res.send(JSON.parse('{"error": "invalid percentageOpen"}'));
        return;
    }
});

// Action setStatus
app.put('/action/setStatus', async (req, res)=>{  
    status = req.body.status;
    if (req.body.status == "OPEN" || req.body.status == "CLOSE"){
        status = req.body.status;
        res.send(JSON.parse('{"status":"'+ status +'"}'));
    }else{
        res.send(JSON.parse('{"error": "invalid status"}'));
        return;
    }
});

// Action setPercentageOpen
app.put('/action/setPercentageOpen', async (req, res)=>{  
    if (req.body.percentageOpen >= 0 && req.body.percentageOpen <= 100){
        percentageOpen = req.body.percentageOpen;
        res.send(JSON.parse('{"percentageOpen":'+ percentageOpen +'}'));
        if (req.body.percentageOpen == 0){
            status = "CLOSED";
        }else{
            status = "OPEN";
        }
    }else{
        res.send(JSON.parse('{"error": "invalid percentageOpen"}'));
        return;
    }
});

// Start the server
app.listen(8063, () => console.log('Example app listening on port 8063!'))

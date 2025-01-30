const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Crea el servidor web
const app = express();

// Habilita CORS
app.use(cors());

// Habilita JSON parsing
app.use(express.json());

// Aplica logs a Express
app.use(morgan('common'));

// Variables de la bombilla
let status = false;
let brightness = 0;

app.get('/', async (req, res) => {
    res.send("This is a virtual light bulb");
});

// Propiedad status
app.get('/property/status', async (req, res) => {  
    res.json({ status });
});

app.post('/property/status', async (req, res) => {  
    if (typeof req.body.status === "boolean") {    
        status = req.body.status;
        res.json({ status });
    } else {
        res.status(400).json({ error: "Invalid status" });
    }
});

// Propiedad brightness
app.get('/property/brightness', async (req, res) => {  
    res.json({ brightness });
});

app.post('/property/brightness', async (req, res) => {  
    if (Number.isInteger(req.body.brightness) && req.body.brightness >= 0 && req.body.brightness <= 255) {
        brightness = req.body.brightness;
        res.json({ brightness });
    } else {
        res.status(400).json({ error: "Invalid brightness" });
    }
});

// Acción setStatus
app.put('/action/setStatus', async (req, res) => {  
    if (typeof req.body.status === "boolean") {    
        status = req.body.status;
        res.json({ status });
    } else {
        res.status(400).json({ error: "Invalid status" });
    }
});

// Acción setBrightness
app.put('/action/setBrightness', async (req, res) => {  
    if (Number.isInteger(req.body.brightness) && req.body.brightness >= 0 && req.body.brightness <= 255) {
        brightness = req.body.brightness;
        res.json({ brightness });
    } else {
        res.status(400).json({ error: "Invalid brightness" });
    }
});

// Inicia el servidor
app.listen(8063, () => console.log('Virtual light bulb running on port 8063!'));

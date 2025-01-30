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

// Variables del sensor de persianas
let status = true;
let motion = false;
let battery = 100;
let temperature = 20;
let illuminance = 1000;
let dark = false;
let daylight = true;

app.get('/', async (req, res) => {
    res.send("This is a virtual blind sensor");
});

// Endpoints de propiedades
app.get('/property/status', async (req, res) => {  
    res.json({ status });
});

app.get('/property/motion', async (req, res) => {  
    res.json({ motion });
});

app.get('/property/battery', async (req, res) => {  
    res.json({ battery });
});

app.get('/property/temperature', async (req, res) => {  
    res.json({ temperature });
});

app.get('/property/illuminance', async (req, res) => {  
    res.json({ illuminance });
});

app.get('/property/dark', async (req, res) => {  
    res.json({ dark });
});

app.get('/property/daylight', async (req, res) => {  
    res.json({ daylight });
});

// Inicia el servidor
app.listen(8063, () => console.log('Virtual blind sensor running on port 8063!'));

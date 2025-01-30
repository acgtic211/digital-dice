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

// Variables del sensor de puerta
let status = "CLOSED";
let structure = "door";

app.get('/', async (req, res) => {
    res.send("This is a virtual door sensor!");
});

// Endpoints de propiedades
app.get('/property/status', async (req, res) => {  
    res.json({ status });
});

app.get('/property/structure', async (req, res) => {  
    res.json({ structure });
});

// Inicia el servidor
app.listen(8063, () => console.log('Virtual door sensor running on port 8063!'));

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

// Variables del sensor de ventana
let status = "CLOSED";
let percentageOpen = 0;

app.get('/', async (req, res) => {
    res.send("This is a virtual window sensor!");
});

// Endpoints de propiedades
app.get('/property/status', async (req, res) => {  
    res.json({ status });
});

app.get('/property/percentageOpen', async (req, res) => {  
    res.json({ percentageOpen });
});

// Inicia el servidor
app.listen(8063, () => console.log('Virtual window sensor running on port 8063!'));

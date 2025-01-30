const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Crea el servidor web
const app = express();

// Configuración de CORS y JSON parsing
app.use(cors());
app.use(express.json());
app.use(morgan('common'));

// Variables del detector de humo
let status = true;
let detectSmoke = false;

// Ruta principal
app.get('/', async (req, res) => {
    res.send("This is a virtual smoke detector");
});

// Propiedad: Estado del sensor
app.get('/property/status', async (req, res) => {  
    res.json({ status });
});

// Propiedad: Detección de humo
app.get('/property/detectSmoke', async (req, res) => {  
    res.json({ detectSmoke });
});

// Acción: Activar/desactivar el detector
app.post('/action/setStatus', async (req, res) => {
    if (typeof req.body.status === "boolean") {
        status = req.body.status;
        res.json({ status });
    } else {
        res.status(400).json({ error: "Invalid status. Must be a boolean." });
    }
});

// Simulación de detección de humo (solo para pruebas)
app.post('/action/setDetectSmoke', async (req, res) => {
    if (typeof req.body.detectSmoke === "boolean") {
        detectSmoke = req.body.detectSmoke;
        res.json({ detectSmoke });
    } else {
        res.status(400).json({ error: "Invalid detectSmoke value. Must be a boolean." });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 8063;
app.listen(PORT, () => console.log(`Virtual smoke detector running on port ${PORT}`));

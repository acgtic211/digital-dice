const dotenv = require('dotenv');
const https = require('https');
const fs = require('fs');
const td = require('./tdLoader');
const virtualizers = require('./generic-virtualizer');

dotenv.config();

if (td.id) {
  console.log(`✅ Iniciando virtualizador para dispositivo ID: ${td.id}`);
  virtualizers.startBehavior(td);
} else {
  console.error("❌ Error: La TD no tiene 'id'.");
  process.exit(1);
}

const port = process.env.PORT_VIRTUALIZER || 8065;
const sslOptions = {
  key: fs.readFileSync("/app/certs/privkey.pem"),
  cert: fs.readFileSync("/app/certs/fullchain.pem"),
};

https.createServer(sslOptions).listen(port, (err) => {
  if (err) {
    console.error("Error al iniciar el servidor HTTPS:", err);
    return;
  }
  console.log(`Servidor HTTPS en ejecución en el puerto ${port}`);
});
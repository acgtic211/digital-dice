const fs = require("fs");
const path = require('path');

const jsonFilePath = path.join('/app/affordance', 'affordance.json');

let affordance;

try {
  // Comprueba si el archivo existe y tiene contenido antes de leerlo
  const stats = fs.statSync(jsonFilePath);

  if (stats.size === 0) {
    console.error('Error: El archivo td.json está vacío (sin texto)');
    process.exit(1);
  }

  const data = fs.readFileSync(jsonFilePath, 'utf8');

  if (!data || data.trim() === "") {
    console.error('Error: El archivo td.json contiene solo espacios en blanco o está vacío');
    process.exit(1);
  }

  affordance = JSON.parse(data);

  if (Object.keys(affordance).length === 0) {
    console.error('Error: El contenido del TD está vacío');
    process.exit(1);
  }

} catch (err) {
  console.error('Error leyendo o parseando el archivo JSON:', err);
  process.exit(1);
}

if (!affordance) {
  console.error('Error: El TD es nulo o indefinido');
  process.exit(1);
}

module.exports = affordance;
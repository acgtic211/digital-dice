const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require('path');

const jsonFilePath = path.join('/app/td', 'originalTd.json');

let td;

try {
  // Comprueba si el archivo existe y tiene contenido antes de leerlo
  const stats = fs.statSync(jsonFilePath);

  if (stats.size === 0) {
    console.error('Error: El archivo originalTd.json está vacío (sin texto)');
    process.exit(1);
  }

  const data = fs.readFileSync(jsonFilePath, 'utf8');

  // Verifica si el contenido leído es vacío o solo tiene espacios en blanco
  if (!data || data.trim() === "") {
    console.error('Error: El archivo originalTd.json contiene solo espacios en blanco o está vacío');
    process.exit(1);
  }

  td = JSON.parse(data);

  // Verifica si el objeto JSON está vacío
  if (Object.keys(td).length === 0) {
    console.error('Error: El contenido del TD está vacío');
    process.exit(1);
  }

} catch (err) {
  console.error('Error leyendo o parseando el archivo JSON:', err);
  process.exit(1);
}

// Validación del TD.
if (!td) {
  console.error('Error: El TD es nulo o indefinido');
  process.exit(1);
}

var thingInteractionSchema = require('./models')

// Connect to the mongoDB
const db = require('./config');

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

router.get('/' + td.id + '/status/sse', async (req, res) => {
    
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);
  console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");

  ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.device": td.id }]}}]).on('change', change => {
      var response = new ThingInteraction(change.fullDocument);
      res.write(`data: ${JSON.stringify(response)}\n\n`)
  });

  req.on('close', () => {
      console.log(`Connection closed`);
  });

})

router.get('/' + td.id + '/property/:propertyName/sse', async (req, res) => {
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.interaction": "property."+req.params.propertyName }]}}]).on('change', change => {
      var response = new ThingInteraction(change.fullDocument);
      res.write(`data: ${JSON.stringify(response.data)}\n\n`)
  }
  );

  req.on('close', () => {
      console.log(`Connection closed`);
  });

})

router.get('/' + td.id + '/property/:propertyName', async (req, res) => {
  const { origin } = req.query;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  if (origin === "physicalDevice") {
  ThingInteraction.findOne({ interaction: "property."+req.params.propertyName, origen: "physicalDevice", device: td.id }, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
      var response = new ThingInteraction(data);
      res.send(response.data)
  });
  } else if (origin === "user") {
      ThingInteraction.findOne({ interaction: "property."+req.params.propertyName, origen: "user", device: td.id }, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
          var response = new ThingInteraction(data);
          res.send(response.data)
      });
  } else {
    ThingInteraction.findOne({ interaction: "property."+req.params.propertyName, device: td.id }, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
      var response = new ThingInteraction(data);
      res.send(response.data)
  });
  }
})

router.post('/' + td.id + '/property/:propertyName', async (req, res) => {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  var interactionValue = new ThingInteraction({
      device: td.id,
      origen: "user",
      interaction: "property." + req.params.propertyName,
      data: req.body
  })

  interactionValue.save(function (err, doc) {
      if (err) res.status(400).send(err);
      else {;
          res.send(doc.data);
      }
  })

})

router.post('/' + td.id + '/action/:actionName', async (req, res) => {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  var interactionValue = new ThingInteraction({
      device: td.id,
      origen: "user",
      interaction: "action." + req.params.actionName,
      data: req.body
  })

  interactionValue.save(function (err, doc) {
      if (err) res.status(400).send(err);
      else res.send(doc.data);
  })


})

router.post('/' + td.id + '/event/:eventName', async (req, res) => {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  var interactionValue = new ThingInteraction({
      device: td.id,
      origen: "eventHandler",
      interaction: "event." + req.params.eventName,
      data: req.body
  })

  interactionValue.save(function (err, doc) {
      if (err) res.status(400).send(err);
      else res.send(doc.data);
  })


})

module.exports = router;

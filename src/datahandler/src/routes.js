const express = require("express");
const router = express.Router();
const td = require("./tdLoader");

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

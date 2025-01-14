const express = require("express");
const EventSource = require("eventsource");
const request = require("request");
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

router.get("/", (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  res.send("It's good to be alive!!!");
});

router.get(`/${td.id}`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  res.send(td);
});

router.get(`/${td.id}/property/:propertyName/sse`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.properties[req.params.propertyName])
    res.status(404).send("That property doesn't exist");

  var eventSourceInitDict = { https: { rejectUnauthorized: false } };
  var es = new EventSource(
    process.env.DH +
      ":8063" +
      "/" +
      td.id +
      "/property/" +
      req.params.propertyName +
      "/sse",
    eventSourceInitDict
  );
  //var es = new EventSource("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse", eventSourceInitDict);
  //request("http://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName+"/sse").pipe(res);

  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);

  es.onmessage = function (event) {
    res.write(`data: ${event.data}\n\n`);
  };
  req.on("close", () => {
    console.log(`Connection closed`);
  });
});

router.get(`/${td.id}/property/:propertyName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.properties[req.params.propertyName])
    res.status(404).send("That property doesn't exist");

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

  request(
    process.env.DH +
      ":8063" +
      "/" +
      td.id +
      "/property/" +
      req.params.propertyName
  ).pipe(res);
  //request("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName).pipe(res);
});

router.post(`/${td.id}/property/:propertyName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.properties[req.params.propertyName])
    res.status(404).send("That property doesn't exist");

  td.properties[req.params.propertyName].required.forEach((element) => {
    if (req.body[element] == undefined)
      res
        .status(404)
        .send(
          "Some of the necessary properties are not in the request - " +
            td.properties[req.params.propertyName].required
        );
  });

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);
  //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, req.body.value);
  request
    .post(
      process.env.DH +
        ":8063" +
        "/" +
        td.id +
        "/property/" +
        req.params.propertyName,
      { json: req.body }
    )
    .pipe(res);
  //request.post("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName, {"json":req.body}).pipe(res)
});

router.post(`/${td.id}/action/:actionName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.actions[req.params.actionName])
    res.status(404).send("That action doesn't exist");

  td.actions[req.params.actionName].required.forEach((element) => {
    if (req.body[element] == undefined)
      res
        .status(404)
        .send(
          "Some of the necessary properties are not in the request - " +
            td.actions[req.params.actionName].required
        );
  });

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

  //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, req.body.value);

  request
    .post(
      process.env.DH +
        ":8063" +
        "/" +
        td.id +
        "/action/" +
        req.params.actionName,
      { json: req.body }
    )
    .pipe(res);
  //request.post("https://localhost:8063"+"/"+td.id+"/action/"+req.params.actionName,{"json":req.body}).pipe(res);
});

router.get(`/${td.id}/event/:eventName`, async (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.actions[req.params.eventName])
    res.status(404).send("That event doesn't exist");

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

  res.redirect(
    process.env.EH + ":8064" + "/" + td.id + "/event/" + req.params.eventName
  );
});

module.exports = router;

const express = require("express");
const EventSource = require("eventsource");
const request = require("request");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const { openAPISpec }= require("./swaggerConfig");
//const td = require('./tdLoader');
const tdLink = require('./tdLoader');

router.get(`/${tdLink.id}/property/:propertyName/sse`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!tdLink.properties[req.params.propertyName])
    res.status(404).send("That property doesn't exist");

  var eventSourceInitDict = { https: { rejectUnauthorized: false } };
  var es = new EventSource(
    process.env.DH +
      ":8063" +
      "/" +
      tdLink.id +
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

router.get(`/${tdLink.id}/property/:propertyName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!tdLink.properties[req.params.propertyName])
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
      tdLink.id +
      "/property/" +
      req.params.propertyName
  ).pipe(res);
  //request("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName).pipe(res);
});

router.post(`/${tdLink.id}/property/:propertyName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!tdLink.properties[req.params.propertyName])
    res.status(404).send("That property doesn't exist");
    if (tdLink.properties[req.params.propertyName].required) {
      tdLink.properties[req.params.propertyName].required.forEach((element) => {
        if (req.body[element] == undefined)
          res
            .status(404)
            .send(
              "Some of the necessary properties are not in the request - " +
                tdLink.properties[req.params.propertyName].required
            );
      });
    }

  const headers = {
    "Content-Type": req.headers["content-type"],
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);
  console.log(headers);
  console.log(req.body);
  //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, req.body.value);
  if (req.headers["content-type"] === "application/json") {
    // Si es JSON, enviar como JSON en la solicitud
    request
      .post(
        process.env.DH +
          ":8063" +
          "/" +
          tdLink.id +
          "/property/" +
          req.params.propertyName,
        { json: req.body, headers: { "Content-Type": req.headers["content-type"] } } // Enviar como JSON
      )
      .pipe(res);  // Responder con el contenido de la respuesta
  } else {
    // Si es texto plano (raw), enviar como texto
    request
      .post(
        process.env.DH +
          ":8063" +
          "/" +
          tdLink.id +
          "/property/" +
          req.params.propertyName,
        { body: req.body, headers: { "Content-Type": req.headers["content-type"] } } // Enviar como texto plano
      )
      .pipe(res);  // Responder con el contenido de la respuesta
  }
  //request.post("https://localhost:8063"+"/"+td.id+"/property/"+req.params.propertyName, {"json":req.body}).pipe(res)
});

router.post(`/${tdLink.id}/action/:actionName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!tdLink.actions[req.params.actionName])
    res.status(404).send("That action doesn't exist");

  tdLink.actions[req.params.actionName].required.forEach((element) => {
    if (req.body[element] == undefined)
      res
        .status(404)
        .send(
          "Some of the necessary properties are not in the request - " +
            tdLink.actions[req.params.actionName].required
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
        tdLink.id +
        "/action/" +
        req.params.actionName,
      { json: req.body }
    )
    .pipe(res);
  //request.post("https://localhost:8063"+"/"+td.id+"/action/"+req.params.actionName,{"json":req.body}).pipe(res);
});

router.get(`/${tdLink.id}/event/:eventName`, async (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!tdLink.actions[req.params.eventName])
    res.status(404).send("That event doesn't exist");

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

  res.redirect(
    process.env.EH + ":8064" + "/" + tdLink.id + "/event/" + req.params.eventName
  );
});

router.get(`/`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  res.send(tdLink);
});


router.use(
  `/openapi`,
  swaggerUi.serve,
  swaggerUi.setup(openAPISpec, {
    customCss: ".swagger-ui .topbar { display: none }",
  })
);


module.exports = router;
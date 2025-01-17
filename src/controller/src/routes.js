const express = require("express");
const EventSource = require("eventsource");
const request = require("request");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const { openAPISpec } = require("./swaggerConfig");
const td = require('./tdLoader');
const tdLink = require('./tdLinkLoader');

router.get(`/`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  res.send(tdLink);
});

router.get(`/${td.id}/property/:propertyName/sse`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.properties[req.params.propertyName]) {
    return res.status(404).send("That property doesn't exist");
  }

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
  if (!td.properties[req.params.propertyName]) {
    return res.status(404).send("That property doesn't exist");
  }

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
});

router.post(`/${td.id}/property/:propertyName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.properties[req.params.propertyName]) {
    return res.status(404).send("That property doesn't exist");
  }

  const requiredProperties = td.properties[req.params.propertyName].required;
  if (requiredProperties) {
    for (const element of requiredProperties) {
      if (req.body[element] === undefined) {
        return res
          .status(400)
          .send(
            "Some of the necessary properties are not in the request - " +
              requiredProperties
          );
      }
    }
  }

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

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
});

router.post(`/${td.id}/action/:actionName`, (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.actions[req.params.actionName]) {
    return res.status(404).send("That action doesn't exist");
  }

  const requiredProperties = td.actions[req.params.actionName].required;
  if (requiredProperties) {
    for (const element of requiredProperties) {
      if (req.body[element] === undefined) {
        return res
          .status(400)
          .send(
            "Some of the necessary properties are not in the request - " +
              requiredProperties
          );
      }
    }
  }

  const headers = {
    "Content-Type": "application/json",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(200, headers);

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
});

router.get(`/${td.id}/event/:eventName`, async (req, res) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  if (!td.events[req.params.eventName]) {
    return res.status(404).send("That event doesn't exist");
  }

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

router.use(
  `/openapi`,
  swaggerUi.serve,
  swaggerUi.setup(openAPISpec, {
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

module.exports = router;
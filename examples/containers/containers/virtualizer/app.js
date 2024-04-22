const express = require('express');
const app = express();
const {Client} = require("@googlemaps/google-maps-services-js");
const dotenv = require('dotenv');
const spdy = require('spdy');
const fs = require('fs');
let throwGarbage = require("./virtualBehaviour.js");
dotenv.config();

const db = require('./configdb');

app.use(express.json());

var containerSchema = require('./models').containerSchema;
var thingInteractionSchema = require('./models').thingInteractionSchema;
const client = new Client({});

var factorAceleracion = 1;
var emptyContainers = false;
var emptyAContainer = false;

var runApp = false;

var container = db.containerConnection.model('Container', containerSchema);
var ThingInteraction = db.thingConnection.model('ThingInteraction', thingInteractionSchema);


app.post('/container', async(req, res) => {

    let aux = req.body;

    if(!aux.location){
        await client.geocode({
            params: {
                address: aux.address,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        }).then(googleRes => {
            var newContainer = new container({
                location: googleRes.data.results[0].geometry.location,
                totalCapacity: aux.totalCapacity,
                capacity: aux.capacity,
                temperature: aux.temperature,
                garbageClass: aux.garbageClass,
                serialNumber: aux.serialNumber,
                address: googleRes.data.results[0].formatted_address
            });
            newContainer.save(function (err, doc) {
                if (err) res.status(400).send(err);
                else {;
                    res.send(doc.data);
                }
            })
        });
    }else{
        
        var newContainer = new container({
            location: aux.location,
            totalCapacity: aux.totalCapacity,
            capacity: aux.capacity,
            temperature: aux.temperature,
            garbageClass: aux.garbageClass,
            serialNumber: aux.serialNumber,
            address: aux.address
        });
        newContainer.save(function (err, doc) {
            if (err) res.status(400).send(err);
            else {;
                res.send(doc.data);
            }
        })
    }

});


app.put('/container/acceleration_factor', function(req, res) {

    factorAceleracion = req.body.accelerationFactor;
    res.sendStatus(200);

})

app.get('/container', async(req, res) => {
    //Devuelve todos los containers
    var containers = await container.find({});
    res.send(containers);
});

//Vaciar todos
app.post('/container/empty_all', function(req, res) {

    emptyContainers = true;
    res.sendStatus(200);
});

app.post('/containers_by_class', function(req, res) {
    
    container.find({garbageClass: req.body.garbageClass}, {}, {}, function(err, data) {
        
        res.send(data);
    });
    
});

app.get('/container/:serialNumber', function(req, res) {
    //Devuelve un contenedor con el serial Number
    container.findOne({serialNumber: req.params.serialNumber}, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new container(data);
        res.send(response)
    });
});

//Aumentar/disminuir temperatura
app.put('/container/:serialNumber/property/temperature', function(req, res) {
    container.findOne({serialNumber: req.params.serialNumber}, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new container(data);
        response.temperature = parseInt(req.body.temperature);
        response.save();
        res.send(response);
    });
})

//Llenar contenedor (capacity)
app.put('/container/:serialNumber/property/capacity', function(req, res) {
    container.findOne({serialNumber: req.params.serialNumber}, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new container(data);
        response.capacity = parseInt(req.body.capacity);
        
        response.save();
        res.send(response)
    });
});

//Vaciar contenedor
app.put('/container/:serialNumber/action/empty_container', function(req, res) {
    container.findOne({serialNumber: req.params.serialNumber}, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new container(data);
        response.capacity = 0;
        response.save();
        res.send(response)
    });
})

//Modificar garbageClass
app.put('/container/:serialNumber/property/garbage_class', function(req, res) {
    container.findOne({serialNumber: req.params.serialNumber}, {}, { sort: { 'createdAt': -1 } }, function (err, data) {
        var response = new container(data);
        response.garbageClass = req.body.garbageClass;
        response.save();
        res.send(response)
    });
})

app.put('/containers/runApp', function(req, res){

    //True => se llenan los contenedores. False => no se llenan los contenedores
    runApp = !runApp;

    res.send(runApp);

});

async function fire(){
    ThingInteraction.watch([{$match: {$and: [ { "fullDocument.device": { $regex: /acg:lab:virtual-containers:/, $options: 'i' }}, {"fullDocument.lastInteraction": true}, { "fullDocument.origen": "virtualDevice"}, {"fullDocument.interaction": "property.containerDetails" }]}}]).on('change', change => {

        //Buscar la interaccion anterior y comprobar si era igual que esta y si es igual no se guarda, pero si es distinta si se guarda(?)
        var fireInteraction = new ThingInteraction({
            device: 'acg:lab:virtual-containers:' + change.fullDocument.data.serialNumber,
            origen: "virtualDevice",
            interaction: "event.fire",
            data: null
        });
        if(change.fullDocument.data.temperature > 80) {
            
            fireInteraction.data = { fire: true };
        } else {

            fireInteraction.data = { fire: false };
        }
        
        fireInteraction.save();

    });
}

fire();

spdy.createServer(
    {
      key: fs.readFileSync("./server.key"),
      cert: fs.readFileSync("./server.crt")
    },
    app
  ).listen(process.env.PORT, (err) => {
    if(err){
      throw new Error(err)
    }
    console.log("Listening on port "+ process.env.PORT)
})



async function run() {
    
    var tiempo = 1500;
    var containers = await container.find({});
    async function ejecutar(){
        setTimeout(function(){
            ejecutar();
        }, tiempo)

        if(runApp){
            if(emptyAContainer) {
                containers = await container.find({});
                emptyAContainer = false;
            }
            await containers.forEach(async (container) => {
               
                if(emptyContainers){
                    
                    container.capacity = 0;
                    await container.save();
                    
                }else{
                    
                    await throwGarbage(container);
                   
                    if(container.capacity > container.totalCapacity){
                        
                    }else{
                        
                        await container.save();  
                        
                    }
                }
    
            })
            
            emptyContainers = false;
        }
        
        tiempo = (300000 * (1 / factorAceleracion));

    }

    ejecutar();
    
}

run();
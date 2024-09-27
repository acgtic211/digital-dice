const dotenv = require('dotenv');
dotenv.config();

const dbTI = require('./configThingInteraction');
const dbC = require('./configContainer');
const axios = require('axios');
//var tiSchema = require('./models').thingInteraction;

var containerModel = dbC.model('Container');
var thingInteractionModel = dbTI.model('ThingInteraction');

async function subToInteractions(){
    
    containerModel.watch().on('change', async (change) => {

        var obj = await containerModel.findById(change.documentKey._id);

        var last = await thingInteractionModel.findOne({ device: "acg:lab:virtual-containers:" + obj.serialNumber, interaction: "property.containerDetails" }, {}, { sort: { 'createdAt': -1 } })
        console.log('antes',last);

        if(last !== null){
            last.set({lastInteraction: false});
        
            last.save();
            
        }

        console.log('despues', last);
        
        var container = {
            location: obj.location,
            totalCapacity: obj.totalCapacity,
            capacity: obj.capacity,
            temperature: obj.temperature,
            garbageClass: obj.garbageClass,
            serialNumber: obj.serialNumber,
            address: obj.address
        }

        var interactionValue = new thingInteractionModel({
            device: "acg:lab:virtual-containers:" + container.serialNumber,
            origen: "virtualDevice",
            interaction: "property.containerDetails",
            data: container,
            lastInteraction: true
        });

        interactionValue.save();

    })
}

async function executeInteractions(){
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    thingInteractionModel.watch([{$match: {$and: [  { "fullDocument.origen": "user"}, {"fullDocument.device": { $regex: /acg:lab:virtual-containers:/, $options: 'i' }} ]}}]).on('change', async (change) => {
        

        var obj = await containerModel.findOne({serialNumber: change.fullDocument.device.slice(27, change.fullDocument.device.length)});
    
        switch(change.fullDocument.interaction) {
            case 'action.emptyContainer':
                obj.set("capacity", 0);
                break;
            case 'action.throwGarbage':
                obj.set("capacity", change.fullDocument.data.capacity);
                break;
            case 'action.changeTemperature':
                obj.set("temperature", change.fullDocument.data.temperature);
                break;
            case 'action.moveContainer':
                obj.set("location", change.fullDocument.data.location);
                break;
            
            default:
                break;
        }
        
        obj.save();
        

    });

}

subToInteractions()
executeInteractions()
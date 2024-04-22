const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var thingInteractionSchema = new Schema({}, { strict: false, timestamps: true });
var containerSchema = new Schema(
    {
        location: {
            type: Map,
            of: String
        },
        totalCapacity: Number,
        capacity: Number,
        garbageClass: String,
        temperature: Number,
        serialNumber: {
            type: Number,
            unique: true
        },
        address: String,
        onRoute: Boolean
    }, { strict: true, timestamps: true });


module.exports = {
    thingInteraction: thingInteractionSchema,
    container: containerSchema
}
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    }, { strict: false, timestamps: true });

var thingInteractionSchema = new Schema({ origen: String}, { strict: false, timestamps: true });

module.exports = {
    containerSchema: containerSchema,
    thingInteractionSchema: thingInteractionSchema
}
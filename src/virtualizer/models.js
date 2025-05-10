const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var thingInteractionSchema = new Schema({ origen: String}, { strict: false, timestamps: true });

mongoose.model('ThingInteraction', thingInteractionSchema);

module.exports = thingInteractionSchema
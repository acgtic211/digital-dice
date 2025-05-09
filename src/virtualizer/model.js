const mongoose = require('mongoose');

// Define the schema for thing interactions
const thingInteractionSchema = new mongoose.Schema({
    data: Object, // The data/payload of the interaction
    device: String, // Device identifier
    interaction: String, // Type of interaction
    origen: String // Origin of the interaction (e.g., "virtualDevice")
}, {
    timestamps: true, // Automatically add createdAt and updatedAt
    collection: 'thinginteractions' // Explicitly set collection name
});

// Export the model
module.exports = mongoose.model('ThingInteraction', thingInteractionSchema);

const mongoose = require('mongoose');

const conn = mongoose.createConnection(process.env.DB_URI+process.env.DB_NAME_TI, {user: process.env.DB_USER_TI, pass: process.env.DB_PASS_TI, useUnifiedTopology: true, useNewUrlParser: true});
conn.model('ThingInteraction', require('./models').thingInteraction);

module.exports = conn;
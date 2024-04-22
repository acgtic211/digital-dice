const mongoose = require('mongoose');

const conn = mongoose.createConnection(process.env.DB_URI+process.env.DB_NAME, {user: process.env.DB_USER, pass: process.env.DB_PASS, useUnifiedTopology: true, useNewUrlParser: true});
conn.model('Container', require('./models').container);


module.exports = conn;

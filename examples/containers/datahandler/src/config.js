const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI+process.env.DB_NAME_TI+'?replicaSet=rs0', {user: process.env.DB_USER_TI, pass: process.env.DB_PASS_TI, useUnifiedTopology: true, useNewUrlParser: true}).then(
 
    () => { console.log("Connected to DB") },
     
    err => { console.log(err) }
     
);

module.exports = mongoose;
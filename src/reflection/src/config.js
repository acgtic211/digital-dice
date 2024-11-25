const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI+process.env.DB_NAME, {user: process.env.DB_USER, pass: process.env.DB_PASS, useUnifiedTopology: true, useNewUrlParser: true}).then(
 
    () => { console.log("Connected to DB") },
     
    err => { console.log(err) }
     
);

module.exports = mongoose;
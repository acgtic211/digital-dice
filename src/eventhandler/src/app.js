const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const { effectsControl } = require('./effectsControl');
const routes = require("./routes");

dotenv.config();

// Creates Web Server
const app = express();

//Cors
app.use(cors());

// parse application/json
app.use(express.text(), express.json())

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// Apply logs template to express
app.use(morgan('common'));

app.use("/", routes);

effectsControl();

app.listen(process.env.PORT_EH, () => {
    console.debug('App listening on port ' + process.env.PORT_EH);
});

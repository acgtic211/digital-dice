const mongoose = require('mongoose');

// Build the connection string from environment variables
// Remove the deprecated options useUnifiedTopology and useNewUrlParser
const connectionString = process.env.DB_URI + process.env.DB_NAME;
const options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
};

console.log(`Connecting to MongoDB at ${process.env.DB_URI} with database ${process.env.DB_NAME}`);

// Connect to the database
mongoose.connect(connectionString, options)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    // Additional error details that might be helpful for debugging
    console.error("Connection details (with credentials masked):", {
      uri: process.env.DB_URI || 'not set',
      dbName: process.env.DB_NAME || 'not set',
      userProvided: !!process.env.DB_USER,
      passProvided: !!process.env.DB_PASS
    });
  });

module.exports = mongoose;
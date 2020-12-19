const mongoose = require('mongoose');
const configs = require('../configs');

//connect to mongoose
const dbPath =
  "mongodb+srv://" +
  configs.mongo.username +
  ":" +
  configs.mongo.server +
  "/" +
  configs.mongo.database +
  "?authSource=admin&replicaSet=atlas-13xii2-shard-0&readPreference=primary&ssl=true";
const options = { useNewUrlParser: true, useUnifiedTopology: true };
const mongo = mongoose.connect(dbPath, options);

mongo.then(
  () => {
    console.log("connected");
  },
  (error) => {
    console.log(error, "error");
  }
);
let db = mongoose.connection;

//Check DB Connection
if (!db) console.log("Error connecting db");
else console.log("DB Connected Successfully");

require('./mongoose_schema');
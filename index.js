let express = require("express");
//import body parser
let bodyParser = require("body-parser");
//import mongoose
let mongoose = require("mongoose");
let passport = require("passport");
let app = express();
var cors = require("cors");
const configs = require("./configs");
//Import routes
let apiRoutes = require("./routes");
app.use(cors());
//configure bodyparser to hande the post requests
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(passport.initialize());

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

// Server Port
let port = process.env.PORT || 8080;

// Welcome message
app.get("/", (req, res) => res.send("Welcome to Express"));

//Use API routes in the App
app.use("/api", apiRoutes);

// Launch app to the specified port
app.listen(port, function () {
  console.log("Running Caro on Port " + port);
});

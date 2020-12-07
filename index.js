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
let port = process.env.PORT || 4000;

// Welcome message
app.get("/", (req, res) => res.send("Welcome to Express"));

//Use API routes in the App
app.use("/api", apiRoutes);

// Launch app to the specified port
const server = app.listen(port);

let port_socket = 4001;

//Socket io
const io = require("socket.io").listen(port_socket);

//queue
let userWaiting = [];
let userPlaying = [];
let interval;

io.on("connection", (socket) => {
  console.log("New Client " + socket.id);
  socket.emit("id", socket.id);

  socket.on("user", (value) => {
    userWaiting.push({ id: socket.id, username: value.username });
    socket.join("waiting room");
    io.to("waiting room").emit("list-user", userWaiting);
  });

  socket.on("log", (value) => {
    console.log(value);
  });

  //when disconnect
  socket.on("disconnect", () => {
    const temp = userWaiting.filter((e) => e.id !== socket.id);
    userWaiting = temp;
    console.log(socket.id + ": disconnect");
    io.to("waiting room").emit("list-user", userWaiting);
  });
});

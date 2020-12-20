let express = require("express");
//import body parser
let bodyParser = require("body-parser");
//import mongoose
let mongoose = require("mongoose");
let passport = require("passport");
let app = express();
var cors = require("cors");
require("./database/db");
const configs = require("./configs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

app.use(cors());
//configure bodyparser to hande the post requests
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(passport.initialize());

// Server Port
let port = process.env.PORT || 4000;

let routes = require("./routes/index");
app.use("/api", routes);

//Use API routes in the App
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Launch app to the specified port
const server = app.listen(port);

//Socket io
const io = require("socket.io").listen(server);
const { socketService } = require("./service/socket");

socketService(io);

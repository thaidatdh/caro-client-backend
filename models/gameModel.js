let mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
//schema
const gameSchema = require('../database/mongoose_schema').gameSchema;

// Export Game Model
let Game = (module.exports = mongoose.model("Game", gameSchema));

module.exports.get = function (callback, limit) {
  Game.find(callback).limit(limit);
};

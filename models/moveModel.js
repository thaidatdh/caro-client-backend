let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
const moveSchema = require('../database/mongoose_schema').moveSchema;

// Export Move Model
let Move = module.exports = mongoose.model('Move', moveSchema);

module.exports.get = function (query, option) {
  option = option || {};
  const promise = Move.find(query);
  // Limit
  if (limit){
    promise.limit(limit)
  }
  // Populate Game
  if (option.isGetGame){
    promise.populate("game");
  }
  // Populate Player
  if (option.isGetPlayer){
    promise.populate("player");
  }
  return promise.exec(); 
}

module.exports.add = function (gameIDStr, playerIDStr, info) {
  info = info || {};
  info.number = info.number || 0;
  info.type = info.type || 'X';
  info.row = info.row || 0;
  info.col = info.col || 0;
  info.time = info.time || Date.now();
  const newMove = new Move({
    gameID: mongoose.Types.ObjectId(gameIDStr),
    playerID: mongoose.Types.ObjectId(playerIDStr),
    number: info.number,  // Based-1 index
    type: info.type,
    row: info.row,
    col: info.col,
    time: info.time
  })
  try {
    return newMove.save();
  } catch(err){
    console.log("Error at adding new Move");
  }
}

module.exports.addMany = function(gameIDStr, moves) {
  try {
    moves = moves.map((move) => {
      return {
        gameID: mongoose.Types.ObjectId(gameIDStr),
        playerID: mongoose.Types.ObjectId(move._id),
        number: move.number || 0,
        type: move.type || "",
        row: move.row || 0,
        col: move.col || 0,
        time: move.time || 0,
      }
    });
    return Move.insertMany(moves);
  } catch(err){
    console.log("Error at adding multiple new Moves");
  }
}

// Danger
module.exports.deleteAll = () => {
  return Move.remove({}).exec();
}
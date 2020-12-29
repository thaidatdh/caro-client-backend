let mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
var bcrypt = require("bcrypt-nodejs");
//schema
const gameSchema = require('../database/mongoose_schema').gameSchema;

// Export Game Model
let Game = (module.exports = mongoose.model("Game", gameSchema));

module.exports.get = function (query, option) {
  option = option || {};
  const promise = Game.find(query);
  // Limit
  if (option.limit){
    promise.limit(limit)
  }
  // Populate Player 1
  if (option.isGetPlayer1){
    promise.populate("player1");
  }
  // Populate Player 2
  if (option.isGetPlayer2){
    promise.populate("player2");
  }
  // Populate Moves
  if (option.isGetMoves){
    promise.populate("moves");
  }
  // Populate Chats
  if (option.isGetChats){
    promise.populate({
      path: "chats",
      populate: {
        path: "player",
        select: "username",
      }
    });
  }
  return promise.exec(); 
};

module.exports.add = function (player1IDStr, player2IDStr, info) {
  info = info || {};
  info.winner = info.winner || "";
  info.totalTime = info.totalTime || 0;
  info.totalX = info.totalX || 0;
  info.totalO = info.totalO || 0;
  info.trophyTransferred = info.trophyTransferred || 0;
  info.create_at = info.create_at || Date.now();
  const newGame = new Game({
    player1ID: new ObjectId(player1IDStr),
    player2ID: new ObjectId(player2IDStr),
    winner: info.winner,
    totalTime: info.totalTime || 0,
    totalX: info.totalX,
    totalO: info.totalO,
    trophyTransferred: info.trophyTransferred,
    create_at: info.create_at
  })
  try {
    return newGame.save();
  } catch(err){
    console.log("Error at adding new Game");
  }
}

module.exports.getOne = function (idStr, option) {
  option = option || {};
  const promise = Game.findOne({_id: new ObjectId(idStr)});
  // Limit
  if (option.limit){
    promise.limit(limit)
  }
  // Populate Player 1
  if (option.isGetPlayer1){
    promise.populate("player1");
  }
  // Populate Player 2
  if (option.isGetPlayer2){
    promise.populate("player2");
  }
  // Populate Moves
  if (option.isGetMoves){
    promise.populate("moves");
  }
  // Populate Chats
  if (option.isGetChats){
    promise.populate({
      path: "chats",
      populate: {
        path: "player",
        select: "username",
      }
    });
  }
  return promise.exec(); 
};

// Danger
module.exports.deleteAll = () => {
  return Game.remove({}).exec();
}
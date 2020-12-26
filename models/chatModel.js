let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
const chatSchema = require('../database/mongoose_schema').chatSchema;

// Export Chat Model
let Chat = module.exports = mongoose.model('Chat', chatSchema);

module.exports.get = function (query, option) {
  option = option || {};
  const promise = Chat.find(query);
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
  info.content = info.content || "";
  info.time = info.time || Date.now();
  const newChat = new Chat({
    gameID: mongoose.Types.ObjectId(gameIDStr),
    playerID: mongoose.Types.ObjectId(playerIDStr),
    content: info.content,
    time: info.time
  })
  try {
    return newChat.save();
  } catch(err){
    console.log("Error at adding new Chat");
  }
}

module.exports.addMany = function(gameIDStr, chats) {
  try {
    chats = chats.map((chat) => {
      return {
        gameID: mongoose.Types.ObjectId(gameIDStr),
        playerID: mongoose.Types.ObjectId(chat._id),
        content: chat.content || "",
        time: chat.time || Date.now()
      }
    })
    return Chat.insertMany(chats);
  } catch(err){
    console.log("Error at adding multiple new Moves");
  }
}

// Danger
module.exports.deleteAll = () => {
  return Chat.remove({}).exec();
}
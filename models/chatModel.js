let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
const chatSchema = require('../database/mongoose_schema').chatSchema;

// Export Chat Model
let Chat = module.exports = mongoose.model('Chat', chatSchema);

module.exports.get = function (callback, limit) {
  Chat.find(callback).limit(limit); 
}
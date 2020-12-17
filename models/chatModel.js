let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
let chatSchema = mongoose.Schema(
  {
    room_id: {
      type: String,
      required: false,
      default: "",
    },
    user_id: {
      type: String,
      required: false,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
// Export User Model
let Chat = module.exports = mongoose.model('chat', chatSchema);

module.exports.get = function (callback, limit) {
  Chat.find(callback).limit(limit); 
}
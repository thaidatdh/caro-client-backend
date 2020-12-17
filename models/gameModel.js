let mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
//schema
let gameSchema = mongoose.Schema(
  {
    user_1_id: {
      type: String,
      required: false,
      default: "",
    },
    user_2_id: {
      type: String,
      required: false,
      default: "",
    },
    history: {
      type: String,
      required: false,
      default: "",
    },
    winner: {
      type: String,
      required: false,
    },
    isEnded: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
gameSchema.virtual("chat", {
  ref: "chat",
  localField: "_id",
  foreignField: "game_id",
  justOne: false,
});
gameSchema.virtual("user1", {
  ref: "user",
  localField: "user_1_id",
  foreignField: "_id",
  justOne: true,
});
gameSchema.virtual("user2", {
  ref: "user",
  localField: "user_2_id",
  foreignField: "_id",
  justOne: true,
});
// Export User Model
let Game = (module.exports = mongoose.model("game", gameSchema));

module.exports.get = function (callback, limit) {
  Game.find(callback).limit(limit);
};

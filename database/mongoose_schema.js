const mongoose = require("mongoose");
require("mongoose-long")(mongoose);
const configs = require("../configs");
const SchemaTypes = mongoose.Schema.Types;

// User
const userSchema = new mongoose.Schema(
  {
    user_type: { type: String, default: configs.user_types.default },
    username: String,
    password: String,
    name: String,
    email: String,
    avatar: {
      type: String,
      default: configs.userSchema.default_photo_url,
    },
    win: { type: Number, default: 0 },
    lose: { type: Number, default: 0 },
    draw: { type: Number, default: 0 },
    trophy: { type: Number, default: 0 },
    rank: { type: String, default: configs.rank.default },
    created_at: { type: Date, default: Date.now },
    googleID: String,
    facebookID: String,
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { collection: "users" },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("boards", {
  ref: "Game",
  localField: "userID",
  foreignField: "userID",
  justOne: false,
});

userSchema.index({ coords: "2dsphere" });
//mongoose.model("User", userSchema);

// Game
const gameSchema = new mongoose.Schema(
  {
    player1ID: SchemaTypes.ObjectId,
    player2ID: SchemaTypes.ObjectId,
    winner: Number,
    totalTime: { type: SchemaTypes.Long, min: 0, default: 0 },
    totalX: Number,
    totalO: Number,
    trophyTransferred: Number,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "games" },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

gameSchema.virtual("player1", {
  ref: "User",
  localField: "player1",
  foreignField: "_id",
  justOne: true,
});

gameSchema.virtual("player2", {
  ref: "User",
  localField: "player2",
  foreignField: "_id",
  justOne: true,
});

gameSchema.virtual("moves", {
  ref: "Move",
  localField: "_id",
  foreignField: "gameID",
  justOne: false,
});

gameSchema.virtual("chats", {
  ref: "Chat",
  localField: "_id",
  foreignField: "gameID",
  justOne: false,
});

gameSchema.index({ coords: "2dsphere" });
//mongoose.model("Game", gameSchema);

// Move
const moveSchema = new mongoose.Schema(
  {
    gameID: SchemaTypes.ObjectId,
    playerID: SchemaTypes.ObjectId,
    number: Number,
    type: String,
    row: Number,
    col: Number,
    time: { type: SchemaTypes.Long, min: 0, default: 0 },
  },
  { collection: "moves" },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

moveSchema.virtual("game", {
  ref: "Game",
  localField: "gameID",
  foreignField: "_id",
  justOne: true,
});

moveSchema.virtual("player", {
  ref: "User",
  localField: "playerID",
  foreignField: "_id",
  justOne: true,
});

moveSchema.index({ coords: "2dsphere" });
//mongoose.model("Move", moveSchema);

// Chat
const chatSchema = new mongoose.Schema(
  {
    gameID: SchemaTypes.ObjectId,
    playerID: SchemaTypes.ObjectId,
    content: String,
    time: { type: SchemaTypes.Long, min: 0, default: 0 },
  },
  { collection: "chats" },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

chatSchema.virtual("game", {
  ref: "Game",
  localField: "gameID",
  foreignField: "_id",
  justOne: true,
});

chatSchema.virtual("player", {
  ref: "User",
  localField: "playerID",
  foreignField: "_id",
  justOne: true,
});

chatSchema.index({ coords: "2dsphere" });
//mongoose.model("Chat", chatSchema);

module.exports = {
  userSchema,
  gameSchema,
  moveSchema,
  chatSchema,
};

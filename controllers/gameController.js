//Import Game Model
Game = require("../models/gameModel");

//For index
exports.index = function (req, res) {
  Game.get(function (err, game) {
    if (err)
      res.json({
        status: "error",
        message: err,
      });
    res.json({
      status: "success",
      message: "Got Game Successfully!",
      data: game,
    });
  });
};

//For creating new game
exports.add = function (req, res) {
  let game = new Game();
  game.player1ID = req.body.player1ID ? req.body.player1ID : game.player1ID;
  game.player2ID = req.body.player2ID ? req.body.player2ID : game.player2ID;
  game.totalX = req.body.totalX ? req.body.totalX : game.totalX;
  game.totalY = req.body.totalY ? req.body.totalY : game.totalY;
  game.winner = req.body.winner ? req.body.winner : game.winner;
  game.totalTime = req.body.totalTime ? req.body.totalTime : game.totalTime;
  game.trophyTransferred = req.body.trophyTransferred
    ? req.body.trophyTransferred
    : game.trophyTransferred;
  //Save and check error
  game.save(function (err) {
    if (err) res.json(err);

    res.json({
      message: "New Game Added!",
      data: game,
    });
  });
};

// View Game
exports.view = function (req, res) {
  Game.findById(req.params.game_id)
    .populate({
      path: "chat",
      options: { sort: { created_at: 1 } },
    })
    .populate("user1")
    .populate("user2")
    .exec(function (err, game) {
      if (err) res.send(err);
      res.json({
        message: "Game Details",
        data: game,
      });
    });
};
// Update Game
exports.update = function (req, res) {
  Game.findById(req.params.game_id, function (err, game) {
    if (err) res.send(err);
  game.player1ID = req.body.player1ID ? req.body.player1ID : game.player1ID;
  game.player2ID = req.body.player2ID ? req.body.player2ID : game.player2ID;
  game.totalX = req.body.totalX ? req.body.totalX : game.totalX;
  game.totalY = req.body.totalY ? req.body.totalY : game.totalY;
  game.winner = req.body.winner ? req.body.winner : game.winner;
  game.totalTime = req.body.totalTime ? req.body.totalTime : game.totalTime;
  game.trophyTransferred = req.body.trophyTransferred
    ? req.body.trophyTransferred
    : game.trophyTransferred;

    //save and check errors
    game.save(function (err) {
      if (err) res.json(err);
      res.json({
        message: "Game Updated Successfully",
        data: game,
      });
    });
  });
};

// Delete Game
exports.delete = function (req, res) {
  Game.deleteOne(
    {
      _id: req.params.game_id,
    },
    function (err, contact) {
      if (err) res.send(err);
      res.json({
        status: "success",
        message: "Game Deleted",
      });
    }
  );
};

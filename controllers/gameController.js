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
  game.user_1_id = req.body.user_1_id ? req.body.user_1_id : game.user_1_id;
  game.user_2_id = req.body.user_2_id ? req.body.user_2_id : game.user_2_id;
  game.history = req.body.history ? req.body.history : game.history;
  game.isEnded = req.body.isEnded ? req.body.isEnded : game.isEnded;
  game.winner = req.body.winner ? req.body.winner : game.winner;
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
    game.user_1_id = req.body.user_1_id ? req.body.user_1_id : game.user_1_id;
    game.user_2_id = req.body.user_2_id ? req.body.user_2_id : game.user_2_id;
    game.history = req.body.history ? req.body.history : game.history;
    game.isEnded = req.body.isEnded ? req.body.isEnded : game.isEnded;
    game.winner = req.body.winner ? req.body.winner : game.winner;

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

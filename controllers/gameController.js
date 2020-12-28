//Import Game Model
Game = require("../models/gameModel");
//For index
exports.index = async function (req, res) {
  const option = {
    isGetPlayer1: true,
    isGetPlayer2: true,
    isGetChats: true,
  };
  try {
    const games = await Game.get({}, option);
    let returnGames = games.map((game) =>
      Object.assign(
        { player1: game.player1, player2: game.player2, chats: game.chats },
        game._doc
      )
    );
    console.log(returnGames);
    res.json({
      status: "success",
      message: "Got Game Successfully!",
      data: returnGames,
    });
  } catch (err) {
    res.json({
      status: "error",
      message: err,
    });
  }
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
      path: "chats",
      options: { sort: { created_at: 1 } },
    })
    .populate("player1")
    .populate("player2")
    .populate("moves")
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

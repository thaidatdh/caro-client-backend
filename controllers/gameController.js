const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

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
        {
          player1: game.player1,
          player2: game.player2,
          chats: game.chats.map((chat) =>
            Object.assign({username: chat.player.username}, chat._doc)
          ),
        },
        game._doc
      )
    );
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

// History
exports.history = async(req, res) => {
  const userID = req.query.userID;
  const gameID = req.query.gameID;
  if (!userID || !gameID) {
    return res.status(403).send({
      success: false,
      errors: [
        {
          msg: "Params invalid.",
          param: "paramsInvalid",
        },
      ],
    });
  } else {
    try {
      const option = {
        isGetPlayer1: true,
        isGetPlayer2: true,
        isGetChats: true,
        isGetMoves: true
      }
      const game = await Game.getOne(gameID, option);
      if (!game || (game.player1._id != userID && game.player2._id != userID)){
        res.status(403).send({
          success: false,
          errors: [
            {
              msg: "No authority to view.",
              param: "noAuthority",
            },
          ],
        });
      } else {
        res.json({
          success: true,
          msg: "Get Game Success",
          game: {
            _id: game._id,
            winner: game.winner,
            totalTime: game.totalTime,
            totalX: game.totalX,
            totalO: game.totalO,
            trophyTransferred: game.trophyTransferred,
            player1: {
              username: game.player1.username,
              name: game.player1.name,
              email: game.player1.email,
              win: game.player1.win,
              lose: game.player1.lose,
              draw: game.player1.draw,
              trophy: game.player1.trophy,
              rank: game.player1.rank,
              avatar: game.player1.avatar
            },
            player2: {
              username: game.player2.username,
              name: game.player2.name,
              email: game.player2.email,
              win: game.player2.win,
              lose: game.player2.lose,
              draw: game.player2.draw,
              trophy: game.player2.trophy,
              rank: game.player2.rank,
              avatar: game.player2.avatar
            },
            create_at: game.create_at,
            chats: game.chats.map((chat) =>
              Object.assign(
                {
                  _id: chat._id,
                  username: chat.player.username,
                  content: chat.content,
                  time: chat.time
                },
              )
            ),
            moves: [...game.moves]
          }
        })
      }
    } catch(err){
      console.log("Error at getting game's history");
      res.status(403).send({
        success: false,
        errors: [
          {
            msg: "No authority to view.",
            param: "noAuthority",
          },
        ],
      });
    }
  }
}
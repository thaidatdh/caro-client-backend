//Import Chat Model
Chat = require("../models/chatModel");

//For index
exports.index = function (req, res) {
  Chat.get(function (err, chat) {
    if (err)
      res.json({
        status: "error",
        message: err,
      });
    res.json({
      status: "success",
      message: "Got Chat Successfully!",
      data: chat,
    });
  });
};

//For creating new chat
exports.add = function (req, res) {
  let chat = new Chat();
  chat.gameID = req.body.gameID ? req.body.gameID : chat.gameID;
  chat.playerID = req.body.playerID ? req.body.playerID : chat.playerID;
  chat.number = req.body.number ? req.body.number : chat.number;
  chat.type = req.body.type ? req.body.type : chat.type;
  chat.row = req.body.row ? req.body.row : chat.row;
  chat.col = req.body.col ? req.body.col : chat.col;
  chat.time = req.body.time ? req.body.time : chat.time;
  //Save and check error
  chat.save(function (err) {
    if (err) res.json(err);

    res.json({
      message: "New Chat Added!",
      data: chat,
    });
  });
};

// View Chat
exports.view = function (req, res) {
  Chat.findById(req.params.chat_id, function (err, chat) {
    if (err) res.send(err);
    res.json({
      message: "Chat Details",
      data: chat,
    });
  });
};
// Update Chat
exports.update = function (req, res) {
  Chat.findById(req.params.chat_id, function (err, chat) {
    if (err) res.send(err);
    chat.gameID = req.body.gameID ? req.body.gameID : chat.gameID;
    chat.playerID = req.body.playerID ? req.body.playerID : chat.playerID;
    chat.number = req.body.number ? req.body.number : chat.number;
    chat.type = req.body.type ? req.body.type : chat.type;
    chat.row = req.body.row ? req.body.row : chat.row;
    chat.col = req.body.col ? req.body.col : chat.col;
    chat.time = req.body.time ? req.body.time : chat.time;
    //save and check errors
    chat.save(function (err) {
      if (err) res.json(err);
      res.json({
        message: "Chat Updated Successfully",
        data: chat,
      });
    });
  });
};

// Delete Chat
exports.delete = function (req, res) {
  Chat.deleteOne(
    {
      _id: req.params.chat_id,
    },
    function (err, contact) {
      if (err) res.send(err);
      res.json({
        status: "success",
        message: "Chat Deleted",
      });
    }
  );
};

exports.delete_many = function (req, res) {
  Chat.deleteMany(
    { _id: { $in: req.body.list_chat_id } },
    function (err, chat) {
      if (err)
        res.json({
          status: "error",
          message: err,
        });
      res.json({
        status: "success",
        message: "Delete Chat Successfully!",
      });
    }
  );
};

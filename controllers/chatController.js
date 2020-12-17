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
  chat.room_id = req.body.room_id ? req.body.room_id : chat.room_id;
  chat.user_id = req.body.user_id ? req.body.user_id : chat.user_id;
  chat.content = req.body.content;
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
    chat.room_id = req.body.room_id ? req.body.room_id : chat.room_id;
    chat.user_id = req.body.user_id ? req.body.user_id : chat.user_id;
    chat.content = req.body.content;

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

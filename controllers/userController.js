const { json } = require("body-parser");
let jwt = require("jsonwebtoken");
const config = require("../passport/config");
//Import User Model
User = require("../models/userModel");

//For index
exports.index = function (req, res) {
  User.get(function (err, users) {
    if (err)
      res.status(400).send({
        success: false,
        message: "Error",
      });
    res.json({
      users,
    });
  });
};

//For creating new user
exports.add = function (req, res) {
  const decodedString = Buffer.from(req.body.data, "base64");
  const decoded = JSON.parse(decodedString);
  let user = new User();
  user.name = decoded.name ? decoded.name : user.name;
  user.username = decoded.username ? decoded.username : user.username;
  user.password = decoded.password ? decoded.password : user.password;
  user.email = decoded.email ? decoded.email : user.email;
  user.user_type = decoded.user_type ? decoded.user_type : user.user_type;
  //Save and check error
  user.save(function (errSave) {
    if (errSave) res.json(errSave);
    let token = jwt.sign(JSON.stringify(user), config.secret);
    res.json({
      payload: user,
      token: token,
    });
  });
};

// View User
exports.view = function (req, res) {
  User.findById(req.params.user_id, function (err, user) {
    if (err) res.send(err);
    res.json({
      message: "User Details",
      data: user,
    });
  });
};

// Update User
exports.update = function (req, res) {
  User.findById(req.params.user_id, function (err, user) {
    if (err) res.send(err);
    const decodedString = Buffer.from(req.body.data, "base64");
    const decoded = JSON.parse(decodedString);
    user.name = decoded.name ? decoded.name : user.name;
    user.username = decoded.username ? decoded.username : user.username;
    user.password = decoded.password ? decoded.password : user.password;
    user.email = decoded.email ? decoded.email : user.email;
    user.user_type = decoded.user_type ? decoded.user_type : user.user_type;
    //save and check errors
    user.save(function (err) {
      if (err) res.json(err);
      // if user is found and password is right create a token
      let token = jwt.sign(JSON.stringify(user), config.secret);
      res.json({
        message: "User Updated Successfully",
        payload: user,
        token: token,
      });
    });
  });
};

// Delete User
exports.delete = function (req, res) {
  User.deleteOne(
    {
      _id: req.params.user_id,
    },
    function (err, contact) {
      if (err) res.send(err);
      res.json({
        status: "success",
        message: "User Deleted",
      });
    }
  );
};

exports.signup = function (req, res) {
  const decodedString = Buffer.from(req.body.data, "base64");
  const decoded = JSON.parse(decodedString);
  if (!decoded.password || !decoded.username) {
    res.json({
      success: false,
      message: "username and password.",
    });
  } else {
    // save the user
    User.findOne({ username: decoded.username }, function (err, user) {
      if (err) {
        return res.status(401).send({
          success: false,
          message: "Error when Register",
        });
      }

      if (!user) {
        let newUser = new User({
          name: user.name,
          username: decoded.username,
          password: decoded.password,
          email: decoded.email,
          user_type: decoded.user_type,
        });
        newUser.save(function (err) {
          if (err) {
            return res.status(400).send({
              success: false,
              message: "Username already exists.",
            });
          }
          let token = jwt.sign(JSON.stringify(newUser), config.secret);
          res.status(200).send({
            success: true,
            message: "Successful created new user.",
            user: newUser,
            token: token,
          });
        });
      } else {
        return res
          .status(400)
          .send({ success: false, message: "Username already exists." });
      }
      send;
    });
  }
};
exports.signin = function (req, res) {
  const decodedString = Buffer.from(req.body.data, "base64");
  const decoded = JSON.parse(decodedString);
  User.findOne(
    { $or: [{ email: decoded.email }, { username: decoded.email }] },
    function (err, user) {
      if (err) throw err;

      if (!user) {
        res.status(401).send({
          success: false,
          message: "Authentication failed. User not found.",
        });
      } else {
        // check if password matches
        user.comparePassword(decoded.password, function (err, isMatch) {
          if (isMatch && !err) {
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(user), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: user });
          } else {
            res.status(401).send({
              success: false,
              message: "Authentication failed. Wrong password.",
            });
          }
        });
      }
    }
  );
};

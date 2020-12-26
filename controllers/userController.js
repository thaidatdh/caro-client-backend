const { json } = require("body-parser");
let jwt = require("jsonwebtoken");
const config = require("../passport/config");
//Import User Model
const mongoose = require("mongoose");
User = require("../models/userModel");
const configs = require("../configs");
const mailer = require("../service/mailer");
const Utils = require("../service/utils");
//For index
exports.player_index = function (req, res) {
  User.find({ user_type: configs.user_types.default })
    .sort({ isBlocked: 1 })
    .exec(function (err, users) {
      if (err)
        res.status(400).send({
          success: false,
          message: "Error",
        });
      res.json({
        success: true,
        users,
      });
    });
};
exports.staff_index = function (req, res) {
  User.find({ user_type: { $in: configs.user_types.data_staff } })
    .sort({ isBlocked: 1 })
    .exec(function (err, users) {
      if (err)
        res.status(400).send({
          success: false,
          message: "Error",
        });
      res.json({
        success: true,
        users,
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
    const decodedString = Buffer.from(req.body.data, "base64").toString();
    const decoded = JSON.parse(decodedString);
    user.name = decoded.name ? decoded.name : user.name;
    user.username = decoded.username ? decoded.username : user.username;
    user.password = decoded.password ? decoded.password : user.password;
    user.email = decoded.email ? decoded.email : user.email;
    user.avatar = decoded.avatar ? decoded.avatar : user.avatar;
    user.win = decoded.win ? decoded.win : user.win;
    user.lose = decoded.lose ? decoded.lose : user.lose;
    user.draw = decoded.draw ? decoded.draw : user.draw;
    user.trophy = decoded.trophy ? decoded.trophy : user.trophy;
    user.rank = Utils.evaluateRank(user.win, user.lose, user.draw);
    user.isBlocked =
      decoded.isBlocked != undefined ? decoded.isBlocked : user.isBlocked;
    user.isActive =
      decoded.isActive != undefined ? decoded.isActive : user.isActive;
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
exports.resetPassword = function (req, res) {
  User.findById(req.user._id, function (err, user) {
    if (err) res.send(err);
    user.password = req.body.password ? req.body.password : user.password;
    //save and check errors
    user.save(function (err) {
      if (err) res.json(err);
      // if user is found and password is right create a token
      let token = jwt.sign(JSON.stringify(user), config.secret);
      res.json({
        message: "Password Updated Successfully",
        token: token,
      });
    });
  });
};
exports.emailValidation = function (req, res) {
  User.findById(req.user._id, function (err, user) {
    if (err) res.send(err);
    user.isActive = req.body.isActive ? req.body.isActive : true;
    //save and check errors
    user.save(function (err) {
      if (err) res.json(err);
      // if user is found and password is right create a token
      let token = jwt.sign(JSON.stringify(user), config.secret);
      res.json({
        message: "Account Activated Successfully",
        payload: user,
        token: token,
      });
    });
  });
};
exports.sendEmailValidation = function (req, res) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) res.send(err);
    let token = jwt.sign(JSON.stringify(user), config.secret);
    if (user.email) {
      const mailContent =
        "Please click this url to confirm registration at Caro:\n" +
        configs.frontend_link +
        "account-validation/" +
        token;
      try {
        mailer.sendMail(user.email, "Account validation", mailContent);
        res.json({
          message: "Account Activated Successfully",
          token: token,
        });
      } catch (err) {
        res.json({
          message: "Mail Server Error!",
        });
      }
    }
  });
};
exports.sendEmailResetPassword = function (req, res) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) res.send(err);
    let token = jwt.sign(JSON.stringify(user), config.secret);
    if (user.email) {
      const mailContent =
        "Please click this url to reset password at Caro:\n" +
        configs.frontend_link +
        "reset-password/" +
        token;
      try {
        mailer.sendMail(user.email, "Account Reset Password", mailContent);
        res.json({
          message: "Sent reset password email.",
        });
      } catch (err) {
        res.json({
          message: "Mail Server Error!",
        });
      }
    }
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
  const decodedString = Buffer.from(req.body.data, "base64").toString();
  const decoded = JSON.parse(decodedString);
  decoded.username = decoded.username ? decoded.username.trim() : "";
  decoded.password = decoded.password ? decoded.password.trim() : "";
  decoded.name = decoded.name ? decoded.name.trim() : "";
  decoded.email = decoded.email ? decoded.email.trim() : "";
  if (!decoded.password || !decoded.username) {
    if (!decoded.password) {
      return res.status(422).send({
        success: false,
        errors: [
          {
            value: "",
            msg: "Password is required",
            param: "password",
            location: "body",
          },
        ],
      });
    } else {
      return res.status(422).send({
        success: false,
        errors: [
          {
            value: "",
            msg: "Username is required",
            param: "username",
            location: "body",
          },
        ],
      });
    }
  } else {
    if (decoded.password.length < 8) {
      return res.status(422).send({
        success: false,
        errors: [
          {
            value: decoded.password,
            msg: "Password must be at least 8 chars long",
            param: "password",
            location: "body",
          },
        ],
      });
    }
    if (!decoded.email.includes("@")) {
      return res.status(422).send({
        success: false,
        errors: [
          {
            value: decoded.email,
            msg: "User email is invalid",
            param: "email",
            location: "body",
          },
        ],
      });
    }
    // save the user
    User.findOne({ username: decoded.username }, function (err, user) {
      if (err) {
        return res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }

      if (!user) {
        let newUser = new User({
          name: decoded.name,
          username: decoded.username,
          password: decoded.password,
          email: decoded.email,
          rank: Utils.evaluateRank(0, 0, 0),
          user_type: configs.user_types.default,
        });
        newUser.save(function (err) {
          if (err) {
            return res.status(403).send({
              success: false,
              message: "Username already exists.",
            });
          }
          let token = jwt.sign(JSON.stringify(newUser), config.secret);
          if (decoded.email) {
            const mailContent =
              "Please click this url to confirm registration at Caro:\n" +
              configs.frontend_link +
              "account-validation/" +
              token;
            mailer.sendMail(decoded.email, "Account validation", mailContent);
          }
          res.status(200).send({
            success: true,
            message:
              "Register successfully. Please confirm your email to login.",
          });
        });
      } else {
        return res
          .status(403)
          .send({ success: false, message: "Username already exists." });
      }
    });
  }
};
exports.signin = async function (req, res) {
  User.findOne(
    { $or: [{ email: req.body.username }, { username: req.body.username }] },
    function (err, user) {
      if (err) {
        return res.status(500).send("Internal server error");
      }
      if (!user) {
        return res.status(403).send({
          success: false,
          errors: [
            {
              msg:
                "The username address that you've entered doesn't match any account.",
              param: "emailNotRegistered",
            },
          ],
        });
      } else {
        // check if password matches
        if (req.body.password.length < 8) {
          return res.status(422).send({
            success: false,
            errors: [
              {
                value: req.body.password,
                msg: "Password must be at least 8 chars long",
                param: "password",
                location: "body",
              },
            ],
          });
        } else {
          if (!user.isActive) {
            return res.status(403).send({
              success: false,
              errors: [
                {
                  msg: "Email not confirmed. Please confirm your email.",
                  param: "emailNotConfirmed",
                },
              ],
            });
          }
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              let token = jwt.sign(JSON.stringify(user), config.secret);
              // return the information including token as JSON
              return res.json({ success: true, token: token, user: user });
            } else {
              return res.status(403).send({
                success: false,
                errors: [
                  {
                    msg: "Email or password is not correct",
                    param: "emailPassword",
                  },
                ],
              });
            }
          });
        }
      }
    }
  );
};
//Admin
exports.adminsignin = function (req, res) {
  const decodedString = Buffer.from(req.body.data, "base64").toString();
  const decoded = JSON.parse(decodedString);
  User.findOne(
    { $or: [{ email: decoded.username }, { username: decoded.username }] },
    function (err, user) {
      if (err) {
        return res.status(500).send("Internal server error");
      }

      if (!user) {
        res.status(401).send({
          success: false,
          message: "Authentication failed. User not found.",
        });
      } else {
        if (!configs.user_types.data_staff.includes(user.user_type)) {
          res.status(401).send({
            success: false,
            message: "Authentication failed. User is not one of staffs.",
          });
          return;
        }
        if (user.isBlocked) {
          res.status(401).send({
            success: false,
            message: user.username + " is blocked.",
          });
          return;
        }
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
exports.addstaff = function (req, res) {
  const decodedString = Buffer.from(req.body.data, "base64").toString();
  const decoded = JSON.parse(decodedString);
  if (!decoded.password || !decoded.username) {
    res.json({
      success: false,
      message: "Username and Password required.",
    });
  } else {
    // save the user
    User.findOne({ username: decoded.username }, function (err, user) {
      if (err) {
        return res.status(401).send({
          success: false,
          message: "Internal server error",
        });
      }

      if (!user) {
        let newUser = new User({
          name: user.name,
          username: decoded.username,
          password: decoded.password,
          email: decoded.email,
          name: decoded.name,
          isBlocked: false,
          isActive: true,
          user_type: decoded.user_type
            ? decoded.user_type
            : configs.user_types.default_staff,
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

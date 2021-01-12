const { json } = require("body-parser");
let jwt = require("jsonwebtoken");
const config = require("../passport/config");
//Import User Model
const mongoose = require("mongoose");
User = require("../models/userModel");
const configs = require("../configs");
const mailer = require("../service/mailer");
const Utils = require("../service/utils");
const userModel = require("../models/userModel");
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
exports.view = async function (req, res) {
  const option = {
    isGetGame: true,
    isGetGamePlayer: true,
  };
  try {
    const user = await User.getById(req.params.user_id, option);
    const games1 = user.gamesAsP1.map((g) =>
      Object.assign(
        {
          player1: g.player1,
          player2: g.player2,
          moves: g.moves,
          chats: g.chats.map((c) =>
            Object.assign({ username: c.player.username }, c._doc)
          ),
        },
        g._doc
      )
    );
    const game2 = user.gamesAsP2.map((g) =>
      Object.assign(
        {
          player1: g.player1,
          player2: g.player2,
          moves: g.moves,
          chats: g.chats.map((c) =>
            Object.assign({ username: c.player.username }, c._doc)
          ),
        },
        g._doc
      )
    );
    let games = games1.concat(game2);
    games.sort(function (a, b) {
      return b.created_at - a.created_at;
    });
    const data = Object.assign({ games: games }, user._doc);
    res.json({
      message: "User Details",
      data: data,
    });
  } catch (err) {
    res.json({
      message: "Failed",
    });
  }
};

// Update User
exports.update = function (req, res) {
  User.findById(req.params.user_id, function (err, user) {
    if (err) res.send(err);
    const decodedString = Buffer.from(req.body.data, "base64").toString();
    const decoded = JSON.parse(decodedString);
    const isChangeEmail = decoded.email === user.email;
    user.name = decoded.name ? decoded.name : user.name;
    user.username = decoded.username ? decoded.username : user.username;
    user.password = decoded.password ? decoded.password : user.password;
    user.email = decoded.email ? decoded.email : user.email;
    user.avatar = decoded.avatar ? decoded.avatar : user.avatar;
    user.win = decoded.win ? decoded.win : user.win;
    user.lose = decoded.lose ? decoded.lose : user.lose;
    user.draw = decoded.draw ? decoded.draw : user.draw;
    user.trophy = decoded.trophy ? decoded.trophy : user.trophy;
    user.rank = Utils.evaluateRank(user.win, user.lose, user.draw, user.trophy);
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
      let isEmailSent = false;
      if (isChangeEmail) {
        try {
          mailer.sendMail(user.email, "Account validation", mailContent);
          isEmailSent = true;
        } catch (err) {}
      }
      res.json({
        message: "User Updated Successfully",
        payload: user,
        token: token,
        isEmailSent: isEmailSent,
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
    if (user) {
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
          rank: Utils.evaluateRank(0, 0, 0, 0),
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
            try {
              mailer.sendMail(decoded.email, "Account validation", mailContent);
            } catch (err) {}
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
exports.loginGoogle = function (req, res) {
  if (!req.body.email || !req.body.google_token || !req.body.username) {
    return res.json({
      success: false,
      msg: "Failed Google.",
    });
  }
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(401).send({
        success: false,
        msg: "Error Google",
      });
    }

    if (!user) {
      let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        email: req.body.email,
        googleID: req.body.google_token,
        facebookID: req.body.facebook_token,
        user_type: configs.user_types.default,
        isActive: true,
      });
      newUser.save(function (err) {
        if (err) {
          return res.json({
            success: false,
            msg: "Username already exists.",
          });
        }
        //Sign In Google here
        User.findOne({ email: req.body.email }, function (err, userFounded) {
          if (err) {
            return res.json({
              success: false,
              msg: "Error Google",
            });
          }
          if (
            userFounded &&
            userFounded.isBlocked == false &&
            userFounded.googleID === req.body.google_token
          ) {
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, data: userFounded._id });
          } else if (userFounded && userFounded.isBlocked == true) {
            return res.json({
              success: false,
              msg: "This user is blocked",
            });
          } else {
            if (
              !userFounded ||
              (userFounded.googleID !== "" &&
                userFounded.googleID !== undefined)
            ) {
              return res.json({
                success: false,
                msg: "Google User not match",
              });
            }
            userFounded.googleID = req.body.google_token;
            userFounded.isActive = true;
            userFounded.save(function (err) {
              if (err) {
                return res.json({
                  success: false,
                  msg: "Username already exists.",
                });
              }
              // if user is found and password is right create a token
              let token = jwt.sign(JSON.stringify(userFounded), config.secret);
              // return the information including token as JSON
              res.json({
                success: true,
                token: token,
                user: userFounded,
              });
            });
          }
        });
      });
    } else {
      //Sign In Google here
      User.findOne({ email: req.body.email }, function (err, userFounded) {
        if (err) {
          return res.json({
            success: false,
            msg: "Error Google",
          });
        }
        if (
          userFounded &&
          userFounded.isBlocked == false &&
          userFounded.googleID === req.body.google_token
        ) {
          // if user is found and password is right create a token
          let token = jwt.sign(JSON.stringify(userFounded), config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: token, user: userFounded });
        } else if (userFounded && userFounded.isBlocked == true) {
          return res.json({
            success: false,
            msg: "This user is blocked",
          });
        } else {
          if (
            !userFounded ||
            (userFounded.googleID !== "" && userFounded.googleID !== undefined)
          ) {
            return res.json({
              success: false,
              msg: "Google User not match",
            });
          }
          userFounded.googleID = req.body.google_token;
          userFounded.isActive = true;
          userFounded.save(function (err) {
            if (err) {
              return res.json({
                success: false,
                msg: "Username already exists.",
              });
            }
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: userFounded });
          });
        }
      });
    }
  });
};

exports.loginFacebook = function (req, res) {
  if (!req.body.email || !req.body.facebook_token || !req.body.username) {
    res.json({
      success: false,
      msg: "Failed Facebook.",
    });
  }
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(401).send({
        success: false,
        msg: "Error Facebook",
      });
    }

    if (!user) {
      let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        email: req.body.email,
        googleID: req.body.google_token,
        facebookID: req.body.facebook_token,
        isActive: true,
        user_type: configs.user_types.default,
      });
      newUser.save(function (err) {
        if (err) {
          return res.json({
            success: false,
            msg: "Username already exists.",
          });
        }
        User.findOne({ email: req.body.email }, function (err, userFounded) {
          if (err) {
            return res.json({
              success: false,
              msg: "Error Facebook",
            });
          }
          if (
            userFounded &&
            userFounded.isBlocked == false &&
            userFounded.facebookID === req.body.facebook_token
          ) {
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: userFounded });
          } else if (userFounded && userFounded.isBlocked == true) {
            return res.json({
              success: false,
              msg: "This user is blocked",
            });
          } else {
            if (
              !userFounded ||
              (userFounded.facebookID !== "" &&
                userFounded.facebookID !== undefined)
            ) {
              return res.json({
                success: false,
                msg: "Facebook User not match",
              });
            }
            userFounded.facebookID = req.body.facebook_token;
            userFounded.isActive = true;
            userFounded.save(function (err) {
              if (err) {
                return res.json({
                  success: false,
                  msg: "Username already exists.",
                });
              }
              // if user is found and password is right create a token
              let token = jwt.sign(JSON.stringify(userFounded), config.secret);
              // return the information including token as JSON
              res.json({
                success: true,
                token: token,
                user: userFounded,
              });
            });
          }
        });
      });
    } else {
      //Sign In Facebook here
      User.findOne({ email: req.body.email }, function (err, userFounded) {
        if (err) {
          return res.json({
            success: false,
            msg: "Error Facebook",
          });
        }
        if (
          userFounded &&
          userFounded.isBlocked == false &&
          userFounded.facebookID === req.body.facebook_token
        ) {
          // if user is found and password is right create a token
          let token = jwt.sign(JSON.stringify(userFounded), config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: token, data: userFounded._id });
        } else if (userFounded && userFounded.isBlocked == true) {
          return res.json({
            success: false,
            msg: "This user is blocked",
          });
        } else {
          if (
            !userFounded ||
            (userFounded.facebookID !== "" &&
              userFounded.facebookID !== undefined)
          ) {
            return res.json({
              success: false,
              msg: "Facebook User not match",
            });
          }
          userFounded.facebookID = req.body.facebookID;
          userFounded.isActive = true;
          userFounded.save(function (err) {
            if (err) {
              return res.json({
                success: false,
                msg: "Username already exists.",
              });
            }
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: userFounded });
          });
        }
      });
    }
  });
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
          username: decoded.username,
          password: decoded.password,
          email: decoded.email,
          name: decoded.name,
          isBlocked: false,
          isActive: decoded.isActive,
          rank: Utils.evaluateRank(0, 0, 0, 0),
          user_type: decoded.user_type
            ? decoded.user_type
            : configs.user_types.default_staff,
        });
        console.log(newUser);
        newUser.save(function (err) {
          if (err) {
            return res.status(400).send({
              success: false,
              message: "Username already exists.",
            });
          }
          let token = jwt.sign(JSON.stringify(newUser), config.secret);
          if (decoded.email) {
            const mailContent =
              "Please click this url to confirm registration at Caro:\n" +
              configs.frontend_admin_link +
              "account-validation/" +
              token;
            try {
              mailer.sendMail(decoded.email, "Account validation", mailContent);
            } catch (err) {}
          }
          res.status(200).send({
            success: true,
            message: "Successful created new staff.",
            user: newUser,
            token: token,
          });
        });
      } else {
        return res.status(400).send({
          success: false,
          message: "Username or email already exists.",
        });
      }
    });
  }
};

exports.adminLoginGoogle = function (req, res) {
  if (!req.body.email || !req.body.google_token || !req.body.username) {
    return res.json({
      success: false,
      msg: "Failed Google.",
    });
  }
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(401).send({
        success: false,
        msg: "Error Google",
      });
    }

    if (!user) {
      return res.status(404).send({
        success: false,
        msg: "Staff with this email not found",
      });
    }
    //Sign In Google here
    User.findOne(
      {
        email: req.body.email,
        user_type: { $in: configs.user_types.data_staff },
      },
      function (err, userFounded) {
        if (err) {
          return res.json({
            success: false,
            msg: "Error Google",
          });
        }
        if (
          userFounded &&
          userFounded.isBlocked == false &&
          userFounded.googleID === req.body.google_token
        ) {
          // if user is found and password is right create a token
          let token = jwt.sign(JSON.stringify(userFounded), config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: token, user: userFounded });
        } else if (userFounded && userFounded.isBlocked == true) {
          return res.json({
            success: false,
            msg: "This staff is blocked",
          });
        } else {
          if (
            !userFounded ||
            (userFounded.googleID !== "" && userFounded.googleID !== undefined)
          ) {
            return res.json({
              success: false,
              msg: "Google User not match",
            });
          }
          userFounded.googleID = req.body.google_token;
          userFounded.isActive = true;
          userFounded.save(function (err) {
            if (err) {
              return res.json({
                success: false,
                msg: "Username already exists.",
              });
            }
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: userFounded });
          });
        }
      }
    );
  });
};

exports.adminLoginFacebook = function (req, res) {
  if (!req.body.email || !req.body.facebook_token || !req.body.username) {
    res.json({
      success: false,
      msg: "Failed Facebook.",
    });
  }
  User.findOne(
    {
      email: req.body.email,
      user_type: { $in: configs.user_types.data_staff },
    },
    function (err, user) {
      if (err) {
        return res.status(401).send({
          success: false,
          msg: "Error Facebook",
        });
      }

      if (!user) {
        return res.status(404).send({
          success: false,
          msg: "Staff with this email not found",
        });
      }
      //Sign In Facebook here
      User.findOne({ email: req.body.email }, function (err, userFounded) {
        if (err) {
          return res.json({
            success: false,
            msg: "Error Facebook",
          });
        }
        if (
          userFounded &&
          userFounded.isBlocked == false &&
          userFounded.facebookID === req.body.facebook_token
        ) {
          // if user is found and password is right create a token
          let token = jwt.sign(JSON.stringify(userFounded), config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: token, data: userFounded._id });
        } else if (userFounded && userFounded.isBlocked == true) {
          return res.json({
            success: false,
            msg: "This staff is blocked",
          });
        } else {
          if (
            !userFounded ||
            (userFounded.facebookID !== "" &&
              userFounded.facebookID !== undefined)
          ) {
            return res.json({
              success: false,
              msg: "Facebook User not match",
            });
          }
          userFounded.facebookID = req.body.facebookID;
          userFounded.isActive = true;
          userFounded.save(function (err) {
            if (err) {
              return res.json({
                success: false,
                msg: "Username already exists.",
              });
            }
            // if user is found and password is right create a token
            let token = jwt.sign(JSON.stringify(userFounded), config.secret);
            // return the information including token as JSON
            res.json({ success: true, token: token, user: userFounded });
          });
        }
      });
    }
  );
};

exports.rankingByTrophy = async (req, res) => {
  const limit = req.params.limit ? req.params.limit : 10;
  const page = req.params.pages ? req.params.pages : 1;
  try {
    const result = await userModel.getListRank({}, { limit: limit });
    res.status(200).send({ success: true, payload: result });
  } catch (e) {
    res.status(500).send("Internal Server Error");
  }
};

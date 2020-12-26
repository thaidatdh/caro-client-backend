let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//Cchema
const userSchema = require('../database/mongoose_schema').userSchema;

userSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
      bcrypt.genSalt(10, function (err, salt) {
          if (err) {
              return next(err);
          }
          bcrypt.hash(user.password, salt, null, function (err, hash) {
              if (err) {
                  return next(err);
              }
              user.password = hash;
              next();
          });
      });
  } else {
      return next();
  }
});

userSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
      if (err) {
          return cb(err);
      }
      cb(null, isMatch);
  });
};

let User = module.exports = mongoose.model('User', userSchema);

module.exports.get = function (callback, limit) {
  User.find(callback).limit(limit); 
}

module.exports.setResult = (query, option) => {
    const obj = {};
    if (option.win > 0){
        obj.win = option.win;
    }
    if (option.draw > 0){
        obj.draw = option.draw;
    }
    if (option.lose > 0){
        obj.lose = option.lose;
    }
    if (option.trophy >= 0){
        obj.trophy = option.trophy;
    } else {
        obj.trophy = 0;
    }

    return User.findOneAndUpdate(query, obj).exec();
}

module.exports.setRank = (query, rank) => {
    return User.findOneAndUpdate(query, {rank: rank}).exec();
}
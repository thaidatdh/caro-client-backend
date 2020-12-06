let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
let userSchema = mongoose.Schema({
  name: {
    type: String,
    required: false,
    default: "",
  },
  email: {
    type: String,
    required: false,
    default: "",
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  user_type: {
    type: String,
    required: true,
    default: 'STAFF'
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});
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
// Export User Model
let User = module.exports = mongoose.model('user', userSchema);

module.exports.get = function (callback, limit) {
  User.find(callback).limit(limit); 
}
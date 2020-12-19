let mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//schema
const moveSchema = require('../database/mongoose_schema').moveSchema;

// Export Move Model
let Move = module.exports = mongoose.model('Move', moveSchema);

module.exports.get = function (callback, limit) {
  Move.find(callback).limit(limit); 
}
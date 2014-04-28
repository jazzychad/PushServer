var mongoose = require("mongoose");

var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
  views: {type: Number, default: 0},
  logins: {type: Number, default: 1},
  username: {type: String, index: true},
  name: {type: String},
  avatar: {type: String},
  gh_access_token: {type: String},
  gh_userid: {type: String, index: true},
  is_admin: {type: Boolean, default: false},
  tstamp: {type: Date, default: function(){return new Date();}}
});

var User = mongoose.model('User', UserSchema);

module.exports.User = User;
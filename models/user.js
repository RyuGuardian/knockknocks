'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var eat = require('eat');

var Counter = require(__dirname + '/../models/counter');
var counterEvents = require(__dirname + '/../events/counter_events');

var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

var userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  email: {type: String, unique: true, match: emailRegex},
  basic: {
    username: String,
    password: String
  },

  unseen: {
    jokes: Array,  //contains IDs of unseen jokes
    index: {type: Number, default: 0}  // keeps track of highest ID added to unseen jokes
  }
  // adult: Boolean  //for allowing adult jokes; not in use yet
});

userSchema.methods.generateHash = function(password, callback) {
  bcrypt.hash(password, 10, function(err, hash) {
    if(err) {
      return callback(err);
    }
    
    this.basic.password = hash;
    callback(null, hash);
  }.bind(this));
};

userSchema.methods.compareHash = function(password, callback) {
  bcrypt.compare(password, this.basic.password, callback);
};

userSchema.methods.generateToken = function(callback) {
  eat.encode({id: this._id}, process.env.APP_SECRET, callback);
};

userSchema.methods.updateUnseenArray = function(callback) {
  Counter.findOne({}, function(err, data) {
    if(err) {
      return callback(err);
    }

    if(!data) {
      counterEvents.emit('first_user', this, callback);
    }
    //only do something if user's index is less than the counter (counter === newest joke's ID) (this skips if there are no jokes)
    else if(this.unseen.index < data.seq) {
      for(var i = this.unseen.index + 1; i <= data.seq; i++) {
        this.unseen.jokes.push(i);
      }

      this.unseen.index = data.seq;
      this.save(function(err) {
        if(err) {
          return callback(err);
        }
        callback(null);
      });
    }
  }.bind(this));
};

userSchema.methods.unseenPop = function(jokeID, callback) {
  this.unseen.jokes.splice(this.unseen.jokes.indexOf(jokeID), 1);
  this.save(function(err) {
    if(err) {
      return callback(err);
    }
    callback(null);
  });
};

module.exports = mongoose.model('User', userSchema);

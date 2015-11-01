'use strict';

var EE = require('events').EventEmitter;

var Counter = require(__dirname + '/../models/counter');
var handleError = require(__dirname + '/../lib/handle_error');

var counterEvents = new EE();

counterEvents.on('first_joke', function(joke, next) {
  var counter = new Counter();

  counter.save(function(err) {
    if(err) {
      return next(err);
    }

    joke.save(function(err) {
      if(err) {
        return next(err);
      }
    });
  });
});

counterEvents.on('first_user', function(user, callback) {
  var counter = new Counter();

  counter.save(function(err) {
    if(err) {
      return callback(err);
    }
    user.updateUnseenArray();
  });
});

module.exports = counterEvents;

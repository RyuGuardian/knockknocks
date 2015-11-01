'use strict';

var express = require('express');
var jsonParser = require('body-parser').json();

var User = require(__dirname + '/../models/user');
var handleError = require(__dirname + '/../lib/handle_error');
var httpBasic = require(__dirname + '/../lib/http_basic');
var userEvents = require(__dirname + '/../events/user_events');

var usersRouter = module.exports = exports = express.Router();

usersRouter.post('/signup', jsonParser, function(req, resp) {
  var newUser = new User();
  newUser.basic.username = req.body.username;
  newUser.username = req.body.username;
  newUser.email = req.body.email;
  
  newUser.generateHash(req.body.password, function(err, hash) {
    if(err) {
      return handleError(err, resp, 500); //err = bcrypt hashing error; show as server error (500)
    }
    
    userEvents.emit("hash_generated", resp, newUser, hash);
  });
});

usersRouter.get('/login', httpBasic, function(req, resp) {  
  User.findOne({'basic.username': req.auth.username}, function(err, user) {
    if(err) {
      return handleError(err, resp, 500);  //err = database error; show as server error (500)
    }
    if(!user) {
      return handleError(err, resp, 401);  //couldn't authenticate
    }

    userEvents.emit("user_found", req, resp, user);
  });
});

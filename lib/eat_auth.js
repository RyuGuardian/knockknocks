'use strict';

var eat = require('eat');
var User = require(__dirname + '/../models/user');
var handleError = require(__dirname + '/handle_error');

module.exports = exports = function(req, resp, next) {
  var encryptedToken = req.headers.token || (req.body? req.body.token : undefined);
  if(!encryptedToken) {
    return handleError(null, resp, 401);  //couldn't authenticate
  }

  eat.decode(encryptedToken, process.env.APP_SECRET, function(err, token) {
    if(err) {
      return handleError(err, resp, 500);  //err = eat decoding error; show as server error (500)
    }
    
    User.findOne({_id: token.id}, function(err, user) {
      if(err) {
        return handleError(err, resp, 500);  //err = eat decoding error; show as server error (500)
      }
      if(!user) {
        return handleError(null, resp, 401);  //couldn't authenticate
      }

      req.user = user;
      next();
    });
  });
};


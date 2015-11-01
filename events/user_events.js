'use strict';

var EE = require('events').EventEmitter;

var handleError = require(__dirname + '/../lib/handle_error');

var userEvents = new EE();

userEvents.on("hash_generated", function(resp, newUser) {
  newUser.save(function(err) {
    if(err) {
      return handleError(err, resp, 500);  //err = database error; show as server error (500)
    }
    
    userEvents.emit("user_signed_in", resp, newUser);
  });
});

userEvents.on("user_found", function(req, resp, user) {
  user.compareHash(req.auth.password, function(err, hashresp) {
    if(err) {
      return handleError(err, resp, 500);  //err = bcrypt compare error; show as server error (500)
    }
    if(!hashresp) {
      return handleError(err, resp, 401);  //couldn't authenticate
    }
    
    userEvents.emit("user_signed_in", resp, user);
  });
});

userEvents.on("user_signed_in", function(resp, user) {
  user.updateUnseenArray(function(err) {
    if(err) {
      return handleError(err, resp, 500);  //err = database error; show as server error (500)
    }
  });

  //create and send token to signed-in user
  user.generateToken(function(err, token) {
    if(err) {
      return handleError(err, resp, 500);  //err = eat encoding error; show as server error (500)
    }
    
    resp.json({token: token});
  });
});

module.exports = userEvents;

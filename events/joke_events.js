'use strict';

var EE = require('events').EventEmitter;

var Joke = require(__dirname + '/../models/joke');
var handleError = require(__dirname + '/../lib/handle_error');

var jokeEvents = new EE();

jokeEvents.on('user_knocked', function(resp, user, userToken) {
  if(user.unseen.jokes.length) {
    var randomID = user.unseen.jokes[Math.floor(Math.random() * user.unseen.jokes.length)];
    
    Joke.findOne({ID: randomID}, function(err, data) {
      if(err) {
        return handleError(err, resp, 500);  //err = database error; show as server error (500)
      }

      var jokeText = "Joke #" + data.ID + "\n";
      jokeText +=  "Knock knock.\n"; //first line to send

      resp.json({msg: jokeText, jtoken: data.generateToken(), token: userToken});  //send token, also send joke ID?
    });
  }
  else {
    //if user has empty unseen jokes array,
      //either they ran out (unseen.index > 0),
      //or everything's new (unseen.index == 0 and we have no jokes)
        //ideally, even on initial startup, we'll have jokes available (authored by the creators)
    if(!user.unseen.jokes.length && user.unseen.index > 0) {
      user.unseen.index = 0;
      user.updateUnseenArray(function(err) {
        if(err) {
          return handleError(err, resp, 500);  //err = database error; show as server error (500)
        }

        resp.json({msg:
          "You've seen all our jokes!\n" 
          + "We will now reset your account so you can enjoy all of them all over again!"
        });
      });
    }
  }

  if(!user.unseen.index) {
    resp.json({msg: "Sorry, we don't have any jokes right now. Maybe you can give us some?"});
  }
});

module.exports = jokeEvents;

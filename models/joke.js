/**
 * @fileOverview
    Defines the joke schema.
 * @author
    Austin King
 */

'use strict';

var mongoose = require('mongoose');

var Counter = require(__dirname + '/counter');
var counterEvents = require(__dirname + '/../events/counter_events');

/**
 * The joke schema is used to store jokes given by users.
 * @prop  {string}  setup       
    The line after "Who's there?"
 * @prop  {string}  punchline   
    The line after "_____ who?"
 * @prop  {string}  author      
    The author (user) who submitted the joke.
 * @prop  {boolean} adult_only  
    A flag to indicate the joke is explict and meant for users marked "adult."
 */
var jokeSchema = new mongoose.Schema({
  ID: {type: Number, unique: true},
  jokeText: {
    setup: {type: String, trim: true},
    punchline: {type: String, trim: true},
    searchable: {type: String, unique: true}
  },
  author: String,
  rating: {
    average: {type: Number, min: 0, max: 5, default: 0},  // 0 := unrated
    count: {type: Number, min: 0, default: 0}
  }
  //, adult_only: Boolean {default: true} //not in use right away
});

//validation: make setup and punchline initial capped; case-insensitive, no-punctuation validation

jokeSchema.pre('save', function(next) {
  Counter.findByIdAndUpdate({_id: 'entityId'}, {$inc: {seq: 1}}, function(err, counter) {
    if(err) {
      return next(err);
    }
    if(!counter) {
      counterEvents.emit('first_joke', this, next);
      next();
    }
    else {
      this.ID = counter.seq + 1;
      next();
    }
  }.bind(this));
});

/************** METHODS ******************/
jokeSchema.methods.generateToken = function() {
  return this.ID;
};

jokeSchema.methods.updateRating = function(latestRating) {
  var oldTotalRating = this.rating.average * this.rating.count;
  var newAverage = (oldTotalRating + latestRating) / (this.rating.count + 1);
  this.set({'rating.average': newAverage, 'rating.count': this.rating.count + 1});
};

jokeSchema.methods.indexText = function() {
  return (this.jokeText.setup && this.jokeText.punchline)?
    this.jokeText.searchable = (this.jokeText.setup.toLowerCase().split(/[^a-z0-9]/).join('')
      + this.jokeText.punchline.toLowerCase().split(/[^a-z0-9]/).join(''))
    : "";
};

module.exports = mongoose.model('Joke', jokeSchema);

'use strict';

var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  _id: {type: String, required: true, default: 'entityId'},
  seq: {type: Number, default: 0}
});

module.exports = mongoose.model('Counter', counterSchema);

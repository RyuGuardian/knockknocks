'use strict';

// log shim

module.exports = exports = function() {
  console.log.apply(this, arguments);
};
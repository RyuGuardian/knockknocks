'use strict';

module.exports = function(err, resp, status) {
  var statusMessage = '';
  if(status === 401) {
    statusMessage = "Meow! Could not authenticat.";
  }
  if(status === 500) {
    statusMessage = "Server error.";
  }

  return resp.status(status || 500).json({msg: statusMessage || "Error. Please try again later."});
};

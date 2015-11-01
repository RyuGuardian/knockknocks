'use strict';

module.exports = exports = function(req, resp, next) {
  var userPasswordEncoded = (req.headers.authorization || ' :').split(' ')[1];
  var userPasswordBuffer = new Buffer(userPasswordEncoded, 'base64');
  var userPasswordSplit = userPasswordBuffer.toString('utf8').split(':');
  req.auth = {
    username: userPasswordSplit[0],
    password: userPasswordSplit[1]
  };
  if(!(req.auth.username.length && req.auth.password.length)) {
    console.log('Meow! Could not authenticat: ' + req.auth.username);
    return resp.status(401).send({msg: 'Meow! Could not authenticat.'});
  }
  next();
};

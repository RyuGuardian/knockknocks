'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var expect = chai.expect;

require(__dirname + '/../server.js');

var kkPORT = ':' + (process.env.PORT || 3000);
var kkROOT = '/' + (process.env.KKROOT || '');
var kkURL = (process.env.KKURL || 'localhost') + kkPORT;

describe('the knockknocks server', function() {
  it('should exist, with a database connection', function(done) {
    chai.request(kkURL)
    .get(kkROOT)
    .end(function(err, resp) {
      expect(err).to.eql(null);
      expect(typeof resp.body).to.eql('object');
      done();
    });
  });
});

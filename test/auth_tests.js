'use strict';

var chai = require('chai');
var chaihttp = require('chai-http');
chai.use(chaihttp);
var expect = chai.expect;
var mongoose = require('mongoose');

var User = require(__dirname + '/../models/user');
var eatauth = require(__dirname + '/../lib/eat_auth');
var httpBasic = require(__dirname + '/../lib/http_basic');
var Counter = require(__dirname + '/../models/counter');

process.env.MONGO_URL = 'mongodb://localhost/knockknocks_dev';
require(__dirname + '/../server');
var kkPORT = (process.env.PORT || 3000);
var apiURL = 'localhost:' + kkPORT;

describe('httpBasic', function() {
  it('should be able to parse http basic auth', function() {
    var req = {
      headers: {
        authorization: 'Basic ' + (new Buffer('test:foobarbaz')).toString('base64')
      }
    };

    httpBasic(req, {}, function() {
      expect(typeof req.auth).to.eql('object');
      expect(req.auth.username).to.eql('test');
      expect(req.auth.password).to.eql('foobarbaz');
    });
  });
});

describe('auth', function() {
  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      done();
    });
  });

  it('should be able to create a user', function(done) {
    chai.request(apiURL)
      .post('/signup')
      .send({username: 'testuser1', password: 'testpass1', email: 'testuser1@test.com'})
      .end(function(err, resp) {
        expect(err).to.eql(null);
        expect(resp.body.token).to.have.length.above(0);
        done();
      });
  });

  describe('user already in database', function() {
    before(function(done) {
      var user = new User();
      user.email = 'testuser2@test.com';
      user.username = 'testuser2';
      user.basic.username = 'testuser2';
      user.generateHash('testpass2', function(err, resp) {  /* jshint ignore:line */
        if(err) {
          throw err;
        }
        user.save(function(err, data) {  /* jshint ignore:line */
          if(err) {
            throw err;
          }
          user.generateToken(function(err, token) {
            if(err) {
              throw err;
            }
            this.token = token;
            done();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    });

    it('should be able to sign in', function(done) {
      chai.request(apiURL)
        .get('/login')
        .auth('testuser2', 'testpass2')
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.body.token).to.have.length.above(0);
          done();
        });
    });

    it('should not be able to create a user with a duplicate name', function(done) {
      chai.request(apiURL)
      .post('/signup')
      .send({username: 'testuser2', password: 'testpass3', email: 'testuser3@test.com'})
      .end(function(err, resp) {
        expect(true).to.eql(true);
        expect(err).to.eql(null);
        expect(resp.body.token).to.eql(undefined);
        done();
      });
    });

    it('should not be able to create a user with a duplicate email', function(done) {
      chai.request(apiURL)
      .post('/signup')
      .send({username: 'testuser3', password: 'testpass4', email: 'testuser2@test.com'})
      .end(function(err, resp) {
        expect(true).to.eql(true);
        expect(err).to.eql(null);
        expect(resp.body.token).to.eql(undefined);
        done();
      });
    });

    it('should be able to authenticate with eat auth', function(done) {
      var token = this.token;
      var req = {
        headers: {
          token: token
        }
      };

      eatauth(req, {}, function() {
        expect(req.user.username).to.eql('testuser2');
        done();
      });
    });
  });
});

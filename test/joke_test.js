'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);
var mongoose = require('mongoose');

var Joke = require(__dirname + '/../models/joke');
var User = require(__dirname + '/../models/user');

process.env.MONGO_URL = 'mongodb://localhost/knockknocks_dev';
require(__dirname + '/../server.js');
var kkPORT = (process.env.PORT || 3000);
var jokeURL = 'localhost:' + kkPORT;

describe("the joke resource", function() {
  after(function(done) {
    mongoose.connection.db.dropDatabase(function(err) {
      if(err) {
        throw err;
      }
      done();
    });
  });

  before(function(done) {
    var user = new User();
    user.email = 'tester@test.com';
    user.username = user.basic.username = 'tester';
    user.generateHash('testpass123', function(err) {
      if(err) {
        throw err;
      }
      user.save(function(err) {
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

  it("should respond to 'Knock knock.'", function(done) {
    chai.request(jokeURL)
      .post('/joke')
      .send({token: this.token})
      .end(function(err, resp) {
        expect(err).to.eql(null);
        expect(resp.status).to.eql(200);
        expect(resp.body.msg).to.eql("Who's there?");
        done();
      });
  });

  it("should listen for setup", function(done) {
    chai.request(jokeURL)
      .post('/joke/setup')
      .send({setup: "Old Lady", token: this.token})
      .end(function(err, resp) {
        expect(err).to.eql(null);
        expect(resp.status).to.eql(200);
        expect(resp.body.msg).to.eql("Old Lady who?");
        done();
      });
  });

  it("should listen for punchline and save joke", function(done) {
    chai.request(jokeURL)
      .post('/joke/punchline')
      .send({setup: "Old Lady", punchline: "I didn't know you could yodel", token: this.token})
      .end(function(err, resp) {
        expect(err).to.eql(null);
        expect(resp.status).to.eql(200);
        expect(resp.body.msg).to.eql("That's a new one!");
        done();
      });
  });

  describe("routes that need a joke in the database", function() {
    before(function(done) {
      var testJoke = new Joke({
        jokeText: {
          setup: "To",
          punchline: "To WHOM",
        },
        author: "admin"
      });
      testJoke.indexText();
      testJoke.save(function(err, data) {
        if(err) {
          throw err;
        }

        this.testJoke = data;
        done();
      }.bind(this));
    });
    before(function(done) {
      chai.request(jokeURL)
        .get('/login')
        .auth('tester', 'testpass123')
        .end(function() {
          done();
        });
    });

    it("should be able to tell a joke", function(done) {
      chai.request(jokeURL)
        .post('/knockknock')
        .send({token: this.token})
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.status).to.eql(200);
          expect(resp.body.msg).to.match(/Joke #[12]\nKnock knock.\n/);
          expect(resp.body.token).to.eql(this.token);
          expect(resp.body.jtoken).to.match(/[12]/);
          done();
        }.bind(this));
    });

    it("should be able to respond to set up the joke", function(done) {
      chai.request(jokeURL)
        .post('/whosthere')
        .send({token: this.token, jtoken: this.testJoke.ID})
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.status).to.eql(200);
          expect(resp.body.msg).to.eql("To");
          expect(resp.body.token).to.eql(this.token);
          expect(resp.body.jtoken).to.eql(this.testJoke.ID);
          done();
        }.bind(this));
    });

    it("should be able to tell the punchline", function(done) {
      chai.request(jokeURL)
        .post('/punchline')
        .send({token: this.token, jtoken: this.testJoke.ID})
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.status).to.eql(200);
          expect(resp.body.msg).to.eql("To WHOM");
          expect(resp.body.token).to.eql(this.token);
          expect(resp.body.jtoken).to.eql(this.testJoke.ID);
          done();
        }.bind(this));
    });

    it("should be able to rate a joke", function(done) {
      chai.request(jokeURL)
        .post('/rate')
        .send({token: this.token, jtoken: this.testJoke.ID, rating: 4})
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.status).to.eql(200);
          expect(resp.body.average).to.eql(4);
          expect(resp.body.count).to.eql(1);
          done();
        });
    });

    it("should not save a duplicate joke", function(done) {
      chai.request(jokeURL)
        .post('/joke/punchline')
        .send({setup: "To", punchline: "To WHOM", token: this.token})
        .end(function(err, resp) {
          expect(err).to.eql(null);
          expect(resp.status).to.eql(200);
          expect(resp.body.msg).to.eql("Already heard that one!");
          done();
        });
    });
  });
});
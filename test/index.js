var sketch = require('../');
var path = require('path');
var chai = require('chai');

var expect = chai.expect;

describe('Opening Files', function() {

  it('should open a file', function(done) {
    sketch.open(
      path.join(__dirname, 'test.sketch'),
      done
    );
  });

});

describe('Running Scripts', function() {

  before(function(done) {
    sketch.open(
      path.join(__dirname, 'test.sketch'),
      done
    );
  });

  it('should run a script', function(done) {
    sketch.run(`
      context.document.showMessage('Hello World');
    `, function(err, response, errorMessage) {
      done();
    });
  });

  it('should return a response', function(done) {
    sketch.run(`
      $SD.respond({'hello': 'world'});
    `, function(err, response, errorMessage) {
      expect(response).to.have.keys(['data', 'log', 'requestid']);
      expect(response.data).to.have.keys(['hello']);
      expect(response.data.hello).to.equal('world');
      done();
    });
  });

  it('should be able to read information', function(done) {
    sketch.run(`
      $SD.respond({'artboardCount': context.document.artboards().count()});
    `, function(err, response, errorMessage) {
      expect(response.data.artboardCount).to.equal(1);
      done();
    });
  });

  it('should fix line numbers in error messages', function(done) {
    sketch.run(`
      context.document.showMessageX('Hello World');
    `, function(err, response, errorMessage) {
      done();
    });
  });

});

describe('Using Imports', function() {

  before(function(done) {
    sketch.open(
      path.join(__dirname, 'test.sketch'),
      done
    );
  });

  it('should resolve relative file path', function(done) {
    sketch.run(`
      SD_TEST_response = 'hello from responder.sketch';
      @import './responder.cocoascript'
    `, function(err, response, errorMessage) {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal('hello from responder.sketch');
      done();
    });
  });

  it('should resolve relative file path', function(done) {
    sketch.run(`
      @import './count-artboards.cocoascript'
      SD_TEST_response = artboardCount;
      @import './responder.cocoascript'
    `, function(err, response, errorMessage) {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal(1);
      done();
    });
  });


  it('should resolve relative file path based on config', function(done) {
    sketch.run(`
      @import 'fixtures/set-response.cocoascript'
      @import './responder.cocoascript'
    `, {root: __dirname}, function(err, response, errorMessage) {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal('ABC');
      done();
    });
  });

});

describe('Debugging Scripts', function() {

  before(function(done) {
    sketch.open(
      path.join(__dirname, 'test.sketch'),
      done
    );
  });

  it('should fix line numbers in error messages', function(done) {
    sketch.run(`context.document.showMessageX('Hello World');`,
      function(err, response, error) {
        expect(error.entries.line).to.equal(1);
        done();
      });
  });

  it('should fix line numbers in error messages', function(done) {
    sketch.run(`



      context.document.showMessage('Hello World');
      context.document.showMessageX('Hello World');
    `, function(err, response, error) {
      expect(error.entries.line).to.equal(6);
      done();
    });
  });

});


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

describe.only('Running Scripts', function() {

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

});


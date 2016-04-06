"use strict";
var sketch = require('../');
var path = require('path');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Opening Sketch Files', function() {

  it('should open a file', function() {
    return expect(
      sketch.open(path.join(__dirname, 'test.sketch'))
    ).to.be.fulfilled;
  });

});

describe('Running Inline Scripts', function() {

  before(function() {
    return sketch.open(path.join(__dirname, 'test.sketch'));
  });

  it('should run a script', function() {
    return expect(
      sketch.run(`
        context.document.showMessage('Hello World');
      `)
    ).to.be.fulfilled;
  });

  it('should return a response', function() {
    return sketch.run(`
      $SD.respond({'hello': 'world'});
    `).then((response) => {
      expect(response).to.have.keys(['data', 'log', 'requestid']);
      expect(response.data).to.have.keys(['hello']);
      expect(response.data.hello).to.equal('world');
    });
  });

  it('should be able to read information', function() {
    return sketch.run(`
      $SD.respond({'artboardCount': context.document.artboards().count()});
    `).then((response) => {
      expect(response.data.artboardCount).to.equal(1);
    });
  });

  it('should reject errornoues code', function() {
    return expect(
      sketch.run(`
        context.document.showMessageX('Hello World');
      `)).be.rejected;
  });

});

describe('Running Scripts from files', function() {

  before(function() {
    return sketch.open(path.join(__dirname, 'test.sketch'));
  });

  it('should run a script from a file', function() {
    return sketch.runFile('test.cocoascript').then((response) => {
      expect(response.data.artboardCount).to.equal(1);
    });
  });

  it('should throw an error if file does not exist', function() {
    return expect(
      sketch.runFile('testXXX.cocoascript')
      ).to.be.rejectedWith(Error);
  });

});

describe('Using Imports', function() {

  before(function() {
    return sketch.open(path.join(__dirname, 'test.sketch'));
  });

  it('should resolve relative file path', function() {
    return sketch.run(`
      SD_TEST_response = 'hello from responder.sketch';
      @import './responder.cocoascript'
    `).then((response) => {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal('hello from responder.sketch');
    });
  });

  it('should resolve relative file path', function(done) {
    return sketch.run(`
      @import './count-artboards.cocoascript'
      SD_TEST_response = artboardCount;
      @import './responder.cocoascript'
    `).then((response) => {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal(1);
      done();
    });
  });


  it('should resolve relative file path based on config', function(done) {
    return sketch.run(`
      @import 'fixtures/set-response.cocoascript'
      @import './responder.cocoascript'
    `).then((response) => {
      expect(response.data).to.have.keys(['msg']);
      expect(response.data.msg).to.equal('ABC');
      done();
    });
  });

});


describe('Fix Line Numbers', function() {

  before(function() {
    return sketch.open(path.join(__dirname, 'test.sketch'));
  });

  it('should fix line numbers in error messages', function() {
    return sketch.run(`context.document.showMessageX('Hello World');`)
      .catch((error) => {
        expect(error.entries.line).to.equal(1);
      });
  });

  it('should fix line numbers in error messages', function() {
    return sketch.run(`



      context.document.showMessage('Hello World');
      context.document.showMessageX('Hello World');
    `).catch((error) => {
      expect(error.entries.line).to.equal(6);
    });
  });

  it('should return error with sourceURL', () => {
    return sketch.runFile('fixtures/erroneous-code.cocoascript').catch((error) => {
      expect(error.entries.line).to.equal(3);
      expect(error.entries.sourceURL).to.equal('fixtures/erroneous-code.cocoascript');
    });
  });

  it('should return error with line numbers that reflect imports', function() {
    return sketch.run(`
      @import 'fixtures/erroneous-code.cocoascript'
    `).catch((error) => {
      expect(error.entries.sourceURL).to.equal(__dirname + '/fixtures/erroneous-code.cocoascript');
      expect(error.entries.line).to.equal(3);
    });
  });

  it('independet of the position of the import statement', function() {
    return sketch.run(`


      @import 'fixtures/erroneous-code.cocoascript'
    `).catch((error) => {
      expect(error.entries.sourceURL).to.equal(__dirname + '/fixtures/erroneous-code.cocoascript');
      expect(error.entries.line).to.equal(3);
    });
  });

  it('when doing more than two imports', function() {
    return sketch.run(`
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/erroneous-code.cocoascript'
    `).catch((error) => {
      expect(error.entries.sourceURL).to.equal(__dirname + '/fixtures/erroneous-code.cocoascript');
      expect(error.entries.line).to.equal(3);
    });
  });

  it('should return error with line numbers that reflect imports, when error is in main file', function() {
    return sketch.run(`
      @import 'fixtures/five-lines-of-code.cocoascript'

      context.document.showMessageX('Hello World')
    `).catch((error) => {
      expect(error.entries.line).to.equal(4);
    });
  });

  xit('when doing more than more than two import', function() {
    return sketch.run(`
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/erroneous-code.cocoascript'
      @import 'fixtures/five-lines-of-code.cocoascript'
    `).catch((error) => {
      expect(error.entries.sourceURL).to.equal(__dirname + '/fixtures/erroneous-code.cocoascript');
      expect(error.entries.line).to.equal(3);
    });
  });

  xit('when doing more than more three import before import with error', function() {
    return sketch.run(`
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/five-lines-of-code.cocoascript'
      @import 'fixtures/erroneous-code.cocoascript'
    `).catch((error) => {
      expect(error.entries.sourceURL).to.equal(__dirname + '/fixtures/erroneous-code.cocoascript');
      expect(error.entries.line).to.equal(3);
    });
  });

});


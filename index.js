"use strict";
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var coscript = require('coscript');

var TMP_DIR = 'tmp';
var MAGIC_LINE_CORRECTION = 6;

if (!fs.existsSync(TMP_DIR)){
  fs.mkdirSync(TMP_DIR);
}

var header = fs.readFileSync('header.cocoascript', 'utf-8');

function isErrorMessage(msg) {
  return (msg.indexOf('line: ') != -1
    && msg.indexOf('sourceURL: ') != -1
    && msg.indexOf('column: ') != -1)
}

class ErrorObject {

  constructor() {
    this.entries = {};
  }
  addEntry(key, value) {
    this.entries[key] = value;
  }
  toString() {
    var msg = [];
    Object.keys(this.entries).forEach(function(k) {
      msg.push(`${k}: ${this.entries[k]}`);
    });
    return msg.join('\n');
  }
}

function parseMsg(msg) {
  var error = new ErrorObject();
  var msgParser = /^(\w*): (.*)/gm;
  var result;
  while ((result = msgParser.exec(msg)) !== null) {
    error.addEntry(result[1], result[2]);
  }
  
  return error;
}

function fixLineNumber(scriptFile, msg) {
  // @todo: evaluate imports
  var errorObject = parseMsg(msg);
  errorObject.entries.line = parseInt(errorObject.entries.line) - header.split("\n").length - 1 - MAGIC_LINE_CORRECTION;
  return errorObject;
}

function fixImportsForScript(script, root) {
  var importParser = /@import \'(.*)'/gm;

  // dangerous: http://stackoverflow.com/a/26877091
  var rootPath = root || path.dirname(module.parent.filename);
  
  script = script.replace(importParser, (match, p1, offset, string) => {
    var resolvedPath = path.resolve(rootPath, p1);
    return `@import '${resolvedPath}'`;
  });
  return script;
}

function run(cocoascript, configOrCallback, cb) {

  if(!cb && typeof configOrCallback == 'function') {
    cb = configOrCallback;
    configOrCallback = {};
  }

  var defaultConfig = {
    root: null
  };
  var config = Object.assign({}, defaultConfig, configOrCallback);

  // @TODO: refactor callback signature
  var identifier = new Date().getTime();
  var file = path.join(__dirname, TMP_DIR, identifier + '.cocoascript');

  var script = header;
  script += "\n" + '$SD = SKETCH_DRIVER("' + identifier + '"); log = $SD.log;';
  script += "\n" + cocoascript;

  script = fixImportsForScript(script, config.root);
  fs.writeFileSync(file, script);


  var e = "[[[COScript app:\\\"Sketch\\\"] delegate] runPluginAtURL:[NSURL fileURLWithPath:\\\"" + file + "\\\"]]";
  child_process.exec(coscript + ' -e "' + e + '"', function (err, stdout, stderr) {
    //fs.unlinkSync(file);
    if(err) throw err;
    if(!cb) {
      return;
    }
    if(stderr) {
      cb(null, null, stderr);
    }
    var response = {};
    try {
      var response = JSON.parse(stdout);
      cb(null, response);
    } catch(e) {
      if (isErrorMessage(stdout)) {
        var error = fixLineNumber(file, stdout);
        cb(null, true, error);
        return;
      }
      cb(null, true, e);
    }
    
  });
}

function open(url, cb) {
  run(`
    var path = "${url}";
    [[NSWorkspace sharedWorkspace] openFile:path];
    $SD.respond({});
  `, cb);
}

module.exports.open = open;
module.exports.run = run;


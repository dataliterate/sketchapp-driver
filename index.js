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
    var entries = this.entries;
    Object.keys(entries).forEach(function(k) {
      msg.push(`${k}: ${entries[k]}`);
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

  // dangerous, might be wrong: http://stackoverflow.com/a/26877091
  var rootPath = root || path.dirname(module.parent.filename);
  
  script = script.replace(importParser, (match, p1, offset, string) => {
    var resolvedPath = path.resolve(rootPath, p1);
    return `@import '${resolvedPath}'`;
  });
  return script;
}

function runFile(filePath, userConfig) {

  var defaultConfig = {
    root: null
  };
  var config = Object.assign({}, defaultConfig, userConfig);

  // dangerous, might be wrong: http://stackoverflow.com/a/26877091
  var rootPath = config.root || path.dirname(module.parent.filename);
  var absPath = path.resolve(rootPath, filePath);

  if(!fs.existsSync(absPath)) {
    return new Promise((resolve, reject) => {
      reject(new Error('file ' + absPath + ' does not exist'));
    });
  }
  var script = fs.readFileSync(path.resolve(rootPath, filePath), 'utf-8');

  return run(script, config);

}

function run(cocoascript, userConfig) {

  var defaultConfig = {
    root: null,
    verbose: true
  };
  var config = Object.assign({}, defaultConfig, userConfig);

  function log(s) {
    if(config.verbose) {
      console.log(s);
    }
  }

  // @TODO: refactor callback signature
  var identifier = new Date().getTime();
  var file = path.join(__dirname, TMP_DIR, identifier + '.cocoascript');

  var script = header;
  script += "\n" + '$SD = SKETCH_DRIVER("' + identifier + '"); log = $SD.log;';
  script += "\n" + cocoascript;

  script = fixImportsForScript(script, config.root);
  fs.writeFileSync(file, script);

  return new Promise((resolve, reject) => {

    var e = "[[[COScript app:\\\"Sketch\\\"] delegate] runPluginAtURL:[NSURL fileURLWithPath:\\\"" + file + "\\\"]]";
    child_process.exec(coscript + ' -e "' + e + '"', function (err, stdout, stderr) {
      //fs.unlinkSync(file);
      if(err) throw err;
      if(stderr) {
        log('Process Error: ' + stderr);
        reject(stderr);
        return;
      }
      if(stdout.length <= 1) {
        log('Missing REPL response');
        resolve();
        return;
      }
      var response = {};
      try {
        var response = JSON.parse(stdout);
        resolve(response);
        return;
      } catch(e) {
        if (isErrorMessage(stdout)) {
          log('Sketch Error: ' + stdout);
          var error = fixLineNumber(file, stdout);
          log('Improved Sketch Error: ' + error);
          reject(error);
          return;
        }
        log('Parsing Error: ' + e);
        reject(e);
        return;
      }
      
    });

  });

}

function open(url) {
  return run(`
    var path = "${url}";
    [[NSWorkspace sharedWorkspace] openFile:path];
    $SD.respond({});
  `);
}

module.exports.open = open;
module.exports.run = run;
module.exports.runFile = runFile;
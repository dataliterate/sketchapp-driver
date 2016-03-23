var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var coscript = require('coscript');

var TMP_DIR = 'tmp';
if (!fs.existsSync(TMP_DIR)){
  fs.mkdirSync(TMP_DIR);
}

var header = fs.readFileSync('header.cocoascript');

function run(cocoascript, cb) {
  var identifier = new Date().getTime();
  var file = path.join(__dirname, TMP_DIR, identifier + '.cocoascript');

  var script = header;
  script += "\n" + '$SD = SKETCH_DRIVER("' + identifier + '"); log = $SD.log;';
  script += "\n" + cocoascript;
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


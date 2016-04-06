# ⍚ Sketch Driver

Sketch Driver is a node module to 'drive' [Sketch App](http://developer.sketchapp.com/introduction/) from javascript.

It allows javascript developers to easily create code to open sketch documents, perform [CocoaScript](https://github.com/ccgus/CocoaScript) snippets and retrieve information of the current UI and document state.

Sketch Driver makes it easier to develop and run sketch plugins from the outside of Sketch App.

```
npm install preciousforever/sketch-driver
```

```js
var sketch = require('sketch-driver');
sketch.run(`context.document.showMessage('Hello World');`});
```

## In contrast to sketchtool

[Sketchtool](http://www.sketchapp.com/tool/) is great when you just want to work with the sketch file itself, e.g.: retrieve information about the objects or export artboards..

## In contrast to sketch plugins

Sketch Plugins - accessible from the UI - are great, unless you want to trigger a certain action by code or retrieve a certain information from the outside of Sketch.

## State

Sketch Driver is at an early state (at 'sketch' level so to say), a rough concept as personal preparation for [Sketch Hackday](http://designtoolshackday.com/)

### Next Up
- [x] relative imports
- [x] improve logging
- [x] simple verbosity options
- [x] Promise based API
- [ ] WIP improve linenumber logging when using import statements
- [ ] upload to npm
- [ ] enable (recursive) relative imports
- [ ] execute files
- [ ] add watch example
- [ ] add server based commuincation in addition to [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)

---

# Using Sketch Driver


## Installation

```
npm install sketch-driver --save
```

## Open Files

```js
var sketch = require('sketch-driver');
sketch.open(path.join(__dirname, 'test.sketch'));
```

## Execute code inside sketch

```js
var sketch = require('sketch-driver');
sketch.run(`context.document.showMessage('Hello World');`});
```

## Retrieve information

Use `run(script, callback(err, response, errorMessage))` with a callback function to retrieve information from inside Sketch.

Use the `respond` method on the injected `$SD` object inside CocoaScript to respond with information.

```js
var sketch = require('sketch-driver');
sketch.run(`$SD.respond({'artboardCount': context.document.artboards().count()});`, function(err, response) {
    console.log("current sketch document has " + response.data.artboardCount + "artboards");
    })

```

## Imports

You may use imports relative to the javascript file, where you require 'sketch-driver'. Sketch-Driver will fix the imports, so sketch is able to find the files.

```js
/*
Directory Structure
- node_modules
- snippets/count-artboard.cocoascript
    var artboardCount = context.document.artboards().count(); 
- index.js

content of index.js below
*/
var sketch = require('sketch-driver');
sketch.run(`@import 'snippets/count-artboard.cocoascript'
    $SD.respond({'artboardCount': artboardCount});`, function(err, response) {
    console.log("current sketch document has " + response.data.artboardCount + "artboards");
    })
```

# Development

```
npm install
npm test
```
'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .rawlist('color', 'favorite color?', ['red', 'orange', 'periwinkle'], { save: false })
  .ask(function(err, answer) {
    console.log(answer)
  });

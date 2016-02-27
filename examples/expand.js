'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .expand('color', 'favorite color?', ['red', 'blue', 'green'], { save: false })
  .ask(function(err, answer) {
    console.log(answer)
  });

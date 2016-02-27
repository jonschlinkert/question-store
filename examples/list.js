'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .list('letter', ['a', 'b', 'c'], { save: false })
  .ask(function(err, answer) {
    console.log(answer)
  });

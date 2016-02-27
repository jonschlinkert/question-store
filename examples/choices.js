'use strict';

var Questions = require('..');
var questions = new Questions();

questions.choices('letter', ['a', 'b', 'c'], { save: false })
questions.ask('letter', function(err, answer) {
  console.log(answer)
});

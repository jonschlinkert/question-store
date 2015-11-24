'use strict';

var Question = require('../lib/question');
var question = new Question('name', {
  save: false,
  message: 'What is your name?',
  type: 'input'
});

question.ask(function(err, answer) {
  if (err) return console.error(err);
  console.log(answer);
});

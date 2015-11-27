'use strict';

var Question = require('../lib/question');
var question = new Question('author.name', {
  force: true,
  message: 'What is your name?',
  type: 'input'
});

question.ask(function(err, answer) {
  if (err) return console.error(err);
  console.log(answer);
});

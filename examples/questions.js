'use strict';

var Questions = require('..');
var questions = new Questions();

questions.set('name', 'What is the project name?');
questions.set('desc', 'What is the project description?', {
  save: false
});

questions.ask(function(err, answers) {
  if (err) return console.log(err);
  console.log('answers:', answers);
});

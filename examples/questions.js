'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .set('name', 'What is the project name?')
  .set('desc', 'What is the project description?', {
    force: true
  });

questions.ask(function(err, answers) {
  if (err) return console.log(err);
  console.log('answers:', answers);
});

'use strict';

var match = require('question-match');
var Questions = require('..');
var questions = new Questions();

questions.use(match());
questions.setData(require('../package'))
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?')
  .set('author.url', 'Author url?')

  .set('project.name', 'What is the project name?')
  .set('project.desc', 'What is the project description?');


questions.match('*.name')
  .on('ask', function(key, question) {
    question.force();
  })
  .ask(function(err, answers) {
    console.log(answers);
    next(null, answers);
  });

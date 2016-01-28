'use strict';

var force = require('question-force');
var Questions = require('..');
var questions = new Questions();

questions.use(force());
questions.setData(require('../package'))
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?')
  .set('author.url', 'Author url?')

  .set('project.name', 'What is the project name?')
  .set('project.desc', 'What is the project description?');

questions.force(/^project/)
  .ask(function(err, answer) {
    console.log(answer)
  });

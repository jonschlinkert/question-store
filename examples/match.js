'use strict';

var Questions = require('..');
var questions = new Questions();

questions.enable('force');
questions
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?')
  .set('author.url', 'Author url?')

  .set('project.name', 'Project name?')
  .set('project.desc', 'Project description?', {force: true});

// questions.enqueue('author');

// questions.match(/.*\.name/);

// console.log(questions.queue)

questions
  .ask(function(err, answer) {
    console.log(answer)
  });

'use strict';

var Questions = require('..');
var questions = new Questions({dest: 'examples/answers'});
questions.options.force = true;

questions
  .setGlobal('author.name', 'Author\'s name?')
  .setGlobal('author.url', 'Author\'s GitHub URL?')
  .setGlobal('author.email', 'Author\'s email address?')
  .setGlobal('author.username', 'Author\'s GitHub username?')
  .set('name', 'What is the project name?')
  .set('desc', 'What is the project description?');

questions
  .ask(function(err, answer) {
    console.log(answer)
  });


// console.log(questions.getAnswer('name'))

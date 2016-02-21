'use strict';

var Questions = require('..');
var questions = new Questions();

questions.option('init', 'project');
questions
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?', {save: false})
  .set('description', 'Project description?')
  .set('name', 'Project name?', {save: false})
  // .set('author.url', 'Author url?')

  // .set('project.name', 'What is the project name?')
  // .set('project.description', 'What is the project description?', {force: true});

questions
  .ask(function(err, answer) {
    console.log(arguments)
  });

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Questions = require('..');
var questions = new Questions();

questions
  .option(argv)
  .set('other.foo', 'I\'m a follow up question!!', {save: false})
  .set('author.url', 'Author url?', {save: false})
  .set('project.name', 'What is the project name?')
  .set('project.description', 'What is the project description?', {force: true})
  .set('author.name', 'Author name? (save me)')
  .set('author.username', 'Author username? (don\'t save me)', { save: false })
  .set('init.description', 'Project description?', { force: true })
  .set('init.name', 'Project name? (don\'t save me)', { save: false })
  .set('init.foo', 'I should be skipped', { skip: true })
  .set('init.baz', 'I should ask a question key', { next: 'author.url' })
  .set('init.bar', 'I have a next function', {
    save: false,
    next: function(answer, questions, cb) {
      if (answer === 'c') {
        questions.ask('other', cb);
      } else {
        cb(null, answer);
      }
    }
  })

questions
  .ask('init', function(err, answer) {
    console.log(answer)
  });

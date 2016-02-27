'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Questions = require('..');
var questions = new Questions();

questions
  .option(argv)
  // project
  .set('project.name', '(project) What is the project name?')
  .set('project.description', '(project) What is the project description?', {force: true})

  // author
  .set('author.url', '(author) Author url?', {save: false, default: 'https://github.com'})
  .set('author.name', '(author) Author name? (save me)')
  .set('author.username', '(author) Author username? (don\'t save me)', { save: false })

  // config.tasks
  .set('config.tasks', '(config) What tasks do you want to run?')
  .set('config.next', '(config) The next config question!', { save: false })
  .set('config.other', '(config) The other config question!', { save: false })

  // config.init
  .set('config.init.description', '(config.init) Project description? (I should be skipped)', { force: true })
  .set('config.init.name', '(config.init) Project name? (don\'t save me)', { save: false })
  .set('config.init.url', '(config.init) Project url? (I should be skipped)', { skip: true })

  // config.post
  .set('config.post.description', '(config.post) Project description? (I should be skipped)', { force: true })
  .set('config.post.name', '(config.post) Project name? (don\'t save me)', { save: false })
  .set('config.post.url', '(config.post) Project url? (I should be skipped)', { skip: true })

  // init
  .set('init.description', '(init) Project description (I should be forced)?', { force: true })
  .set('init.name', '(init) Project name? (don\'t save me)', { save: false })
  .set('init.url', '(init) Project url? (I should be skipped)', { skip: true })
  .set('init.baz', '(init) I should ask a question by key (don\'t save me)', {
    next: 'config.next',
    save: false
  })
  .set('init.bar', 'I have a next function', {
    save: false,
    next: function(answer, questions, answers, cb) {
      if (answer === 'other') {
        questions.ask('config.other', cb);
      } else {
        cb(null, answers);
      }
    }
  });


questions
  .ask('init', function(err, answers) {
    console.log(answers)
  });


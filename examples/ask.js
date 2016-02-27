'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Questions = require('..');
var questions = new Questions();

questions
  .option(argv)
  // project
  .set('project.name', '(project.name) What is the project name?')
  .set('project.description', '(project.description) What is the project description?', {force: true})

  // author
  .set('author.url', '(author.url) Author url?', {save: false, default: 'https://github.com'})
  .set('author.name', '(author.name) Author name? (save me)')
  .set('author.username', '(author.username) Author username? (don\'t save me)', { save: false })

  // config.tasks
  .set('config.tasks', '(config.tasks) What tasks do you want to run?')
  .set('config.next', '(config.next) The next config question!', { save: false })
  .set('config.other', '(config.other) The other config question!', { save: false })

  // config.init
  .set('config.init.description', '(config.init) Project description? (I should be skipped)', { force: true })
  .set('config.init.name', '(config.init) Project name? (don\'t save me)', { save: false })
  .set('config.init.url', '(config.init) Project url? (I should be skipped)', { skip: true })

  // config.post
  .set('config.post.description', '(config.post) Project description? (I should be skipped)', { force: true })
  .set('config.post.name', '(config.post) Project name? (don\'t save me)', { save: false })
  .set('config.post.url', '(config.post) Project url? (I should be skipped)', { skip: true })

  // init
  .set('init.description', '(init.description) Project description (I should be forced)?', {
    force: true
  })
  .set('init.name', '(init.name) Project name? (don\'t save me)', { save: false })
  .set('init.url', '(init.url) Project url? (I should be skipped)', { skip: true })
  .set('init.baz', '(init.baz) I should ask a question by key (don\'t save me)', {
    next: 'config.next',
    save: false
  })
  .set('init.bar', '(init.bar) I have a next function', {
    save: false,
    next: function(answer, questions, answers, cb) {
      if (answer === 'other') {
        questions.ask('config.other', cb);
      } else {
        cb(null, answers);
      }
    }
  });

questions.on('error', console.log)
questions
  .ask('init', function(err, answers) {
    console.log(answers)
  });

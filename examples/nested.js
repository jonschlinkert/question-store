'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .option('force', true)
  .setDefault('author.name', 'Author name?')
  .setDefault('author.url', 'Author URL?')
  .setDefault('author.username', 'Author username?')
  .setData('other', 'Other info?')

questions
  .ask('author', function (err, answer) {
    if (err) return console.log(err);
    console.log(answer)
  });

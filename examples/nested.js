'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .setDefault('author.name', 'Author name?')
  .setDefault('author.url', 'Author URL?')
  .setDefault('author.username', 'Author username?')
  .set('other', 'Other info?')

questions
  .ask('author', function (err, answer) {
    if (err) return console.log(err);
    console.log(answer)
  });

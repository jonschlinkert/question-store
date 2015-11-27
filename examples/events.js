'use strict';

var Questions = require('..');
var questions = new Questions({force: true});

questions.on('answer', function(key, val) {
  console.log(key, val)
});

questions
  .set('one.a', 'What is one.a?')
  .set('one.b', 'What is one.b?')
  .set('one.c', 'What is one.c?')
  .set('aaa', 'What is aaa?')
  .set('bbb', 'What is bbb?')
  .set('ccc', 'What is ccc?')
  .set('eee', 'What is eee?')
  .ask(function(err, answers) {
    if (err) return console.log(err);
    console.log('answers:', answers);
  });


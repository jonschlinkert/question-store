'use strict';

var Questions = require('..');
var questions = new Questions();

questions.setData('one.a', 'alpha');
questions.setData('one.b', 'beta');
questions.setData({
  one: {
    c: 'gamma'
  }
});

questions.setData('aaa', 'xxx');
questions.setData('bbb', 'zzz');
questions.setData({
  ccc: 'ddd',
  eee: 'fff'
});

questions
  .set('one.a', 'What is one.a?')
  .set('one.b', 'What is one.b?')
  .set('one.c', 'What is one.c?')
  .set('aaa', 'What is aaa?', {
    force: true
  })
  .set('bbb', 'What is bbb?')
  .set('ccc', 'What is ccc?')
  .set('eee', 'What is eee?')
  .ask(function(err, answers) {
    if (err) return console.log(err);
    console.log('answers:', answers);
  });


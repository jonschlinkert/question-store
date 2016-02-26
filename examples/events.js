'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Questions = require('..');
var questions = new Questions();

questions.option(argv);

questions
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?')

// questions
//   .ask('init', function(err, answers) {
//     console.log(answers)
//   });


questions.on('ask', function(name) {
  questions.ask(name, function(err, answers) {
    if (err) {
      questions.emit('error', err);
    } else {
      questions.emit('answers', answers);
    }
  });
});

questions.on('pre-ask', function(question, answer, answers) {
  console.log();
  console.log('answer:', answer);
  if (answer === 'doowb') {
    questions.emit('ask', 'author.name');
  }
});

questions.on('answer', function(question, answer, answers) {
  console.log();
  console.log('answer:', answer);
  if (answer === 'doowb') {
    questions.emit('ask', 'author.name');
  }
});

questions.on('answers', function(err, answers) {
  console.log();
  console.log('answers ------');
  console.log(answers);
  // app.data(answers);
});

questions.emit('ask', 'author');

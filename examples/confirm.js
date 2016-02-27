'use strict';

var Questions = require('..');
var questions = new Questions();

questions
  .confirm('download', 'Want to download?')
  .ask(function(err, answer) {
    console.log(answer)
  });

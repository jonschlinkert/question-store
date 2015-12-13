'use strict';

var mm = require('micromatch');
var Questions = require('..');
var questions = new Questions();

questions.use(function(app) {

  /**
   * Visit `method` over each property on the given `value`.
   *
   * @param {String} `method` The `questions` method to call.
   * @param {Object} `val`
   * @return {Object}
   */

  app.match = function(patterns) {
    var isMatch;
    if (Array.isArray(patterns)) {
      isMatch = function(key) {
        return mm.any(patterns);
      };
    } else {
      isMatch = mm.matcher(patterns);
    }

    var len = this.queue.length;
    while (len--) {
      var key = this.queue[len];
      if (!isMatch(key)) {
        this.queue.splice(len, 1);
      }
    }
    return this;
  };
});

var pkg = require('../package');

questions.enable('force');
questions
  .set('author.name', 'Author name?')
  .set('author.username', 'Author username?')
  .set('author.url', 'Author url?')

  .set('project.name', 'What is the project name?')
  .set('project.desc', 'What is the project description?', {force: true});


// questions.enqueue('author.username');
// questions.enqueue('project');

// questions.setData('project.name', pkg.name);

questions.match(/\.name/)
  .ask(function(err, answer) {
    console.log(answer)
  });

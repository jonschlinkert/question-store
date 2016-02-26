'use strict';

var async = require('async');
var use = require('use');
var util = require('util');
var path = require('path');
var debug = require('debug')('question-store');
var Store = require('data-store');
var Options = require('option-cache');
var Question = require('./lib/question');
var utils = require('./lib/utils');

/**
 * Answer cache, for caching answers during a session,
 * and potentially across instances
 */

var answerCache = {};

/**
 * Create an instance of `Questions` with the given `options`.
 *
 * ```js
 * var Questions = new Questions(options);
 * ```
 * @param {Object} `options` question store options
 * @api public
 */

function Questions(options) {
  if (!(this instanceof Questions)) {
    return new Questions(options);
  }

  this.options = this.options || {};
  Options.call(this);
  use(this);

  if (options) this.option(options);
  this.initQuestions(this.options);
}

/**
 * Mixin `Emitter` methods
 */

util.inherits(Questions, Options);


/**
 * Intialize question-store
 */

Questions.prototype.initQuestions = function(opts) {
  this.inquirer = opts.inquirer || utils.inquirer();
  this.project = opts.project || utils.project(process.cwd());

  this.answers = answerCache;
  this.data = opts.data || {};
  this.cache = {};
  this.queue = [];

  // persist answers that the user has marked as a "global default"
  utils.sync(this, 'defaults',  function() {
    return new Store('global-answers');
  });

  // persist project-specific answers
  utils.sync(this, 'store', function() {
    return new Store(this.project);
  });

  // persist project-specific hints
  utils.sync(this, 'hints',  function() {
    return new Store('hints/' + this.project);
  });
};

/**
 * Cache a question to be asked at a later point. Creates an instance
 * of [Question](#question), so any `Question` options or settings
 * may be used.
 *
 * ```js
 * questions.set('drink', 'What is your favorite beverage?');
 * // or
 * questions.set('drink', {
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 * // or
 * questions.set({
 *   name: 'drink'
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 * ```
 * @param {Object|String} `value` Question object, message (string), or options object.
 * @param {String} `locale` Optionally pass the locale to use, otherwise the default locale is used.
 * @api public
 */

Questions.prototype.set = function(name, val, options) {
  if (utils.isObject(name) && !utils.isQuestion(name)) {
    return this.visit('set', name);
  }

  var question = new Question(name, val, options);
  this.emit('set', question.name, question);
  this.cache[question.name] = question;

  utils.union(this.queue, [question.name]);
  this.run(question);
  return this;
};

/**
 * Get question `name`, or group `name` if question is not found.
 * You can also do a direct lookup using `quesions.cache['foo']`.
 *
 * ```js
 * var name = questions.get('name');
 * //=> question object
 * ```
 * @param {String} `name`
 * @return {Object} Returns the question object.
 * @api public
 */

Questions.prototype.get = function(key) {
  return !utils.isQuestion(key) ? this.cache[key] : key;
};

/**
 * Returns true if `questions.cache` or `questions.groups` has
 * question `name`.
 *
 * ```js
 * var name = questions.has('name');
 * //=> true
 * ```
 * @return {String} The name of the question to check
 * @api public
 */

Questions.prototype.has = function(key) {
  for (var prop in this.cache) {
    if (prop.indexOf(key) === 0) return true;
  }
  return false;
};

/**
 * Delete the given question or any questions that have the given
 * namespace using dot-notation.
 *
 * ```js
 * questions.del('name');
 * questions.get('name');
 * //=> undefined
 *
 * // using dot-notation
 * questions.del('author');
 * questions.get('author.name');
 * //=> undefined
 * ```
 * @return {String} The name of the question to delete
 * @api public
 */

Questions.prototype.del = function(key) {
  for (var prop in this.cache) {
    if (prop.indexOf(key) === 0) {
      delete this.cache[prop];
    }
  }
};

/**
 * Clear all cached answers.
 *
 * ```js
 * questions.clearAnswers();
 * ```
 *
 * @api public
 */

Questions.prototype.clearAnswers = function() {
  this.answers = answerCache = {};
  this.data = {};
};

/**
 * Clear all questions from the cache.
 *
 * ```js
 * questions.clearQuestions();
 * ```
 *
 * @api public
 */

Questions.prototype.clearQuestions = function() {
  this.cache = {};
  this.queue = [];
};

/**
 * Clear all cached questions and answers.
 *
 * ```js
 * questions.clear();
 * ```
 *
 * @api public
 */

Questions.prototype.clear = function() {
  this.clearQuestions();
  this.clearAnswers();
};

/**
 * Ask one or more questions, with the given `options` and callback.
 *
 * ```js
 * questions.ask(['name', 'description'], function(err, answers) {
 *   console.log(answers);
 * });
 * ```
 * @param {String|Array} `queue` Name or array of question names.
 * @param {Object|Function} `options` Question options or callback function
 * @param {Function} `callback` callback function
 * @api public
 */

Questions.prototype.ask = function(queue, config, cb) {
  if (typeof queue === 'function') {
    return this.ask(this.queue, {}, queue);
  }
  if (typeof config === 'function') {
    return this.ask(queue, {}, config);
  }

  var questions = this.buildQueue(queue);
  var hints = this.hints; // 'hint' store
  var store = this.store; // project-specific answer store
  var self = this;

  async.reduce(questions, this.answers, function(answers, key, next) {
    try {
      var opts = utils.merge({}, self.options, config);
      var data = utils.merge({}, self.data, opts);

      var question = self.get(key);
      var val = question.answer(answers, data, store, hints);
      var options = question.opts(opts);

      if (utils.isEmpty(val) && options.enabled('global')) {
        val = globalStore.get(key);
      }

      // emit question before building options
      self.emit('ask', question, val, answers);

      // re-build options object after emitting ask, to allow
      // user to update question options from a listener
      options = question.opts(opts, question.options);

      if (options.enabled('skip')) {
        question.next(val, self, answers, next);
        return;
      }

      var force = options.get('force');
      var isForced = force === true || utils.matchesKey(force, key);

      if (!isForced && !utils.isEmpty(val)) {
        utils.set(answers, question.name, val);
        question.next(val, self, answers, next);
        return;
      }

      self.inquirer.prompt([question], function(answer) {
        try {
          var val = answer[question.name];

          if (utils.isEmpty(val)) {
            next(null, answers);
            return;
          }

          // persist to 'project' store if 'save' is not disabled
          if (!options.disabled('save')) {
            store.set(question.name, val);
          }

          // persist to 'global-defaults' store if 'global' is enabled
          if (options.enabled('global')) {
            globalStore.set(question.name, val);
          }

          // persist to project-specific 'hint' store, if 'hint' is not disabled
          if (!options.disabled('hint')) {
            hints.set(question.name, val);
          }

          // emit answer
          self.emit('answer', question, val, answers);

          // set answer on 'answers' cache
          utils.set(answers, question.name, val);
          question.next(val, self, answers, next);

        } catch (err) {
          self.emit('error', err);
          next(err);
        }
      });

    } catch (err) {
      self.emit('error', err);
      next(err);
    }
  }, cb);
};

/**
 * Build an array of names of questions to ask.
 *
 * @param {Array|String} keys
 * @return {Object}
 */

Questions.prototype.buildQueue = function(questions) {
  questions = utils.arrayify(questions);
  var len = questions.length;
  var queue = [];
  var idx = -1;

  if (len === 0) {
    queue = this.queue;
  }

  while (++idx < len) {
    utils.union(queue, this.normalize(questions[idx]));
  }
  return queue;
};

/**
 * Normalize the given value to return an array of question keys.
 *
 * @param {[type]} key
 * @return {[type]}
 * @api public
 */

Questions.prototype.normalize = function(key) {
  // get `name` from question object
  if (utils.isQuestion(key)) {
    return [question.name];
  }

  if (this.cache.hasOwnProperty(key)) {
    return [key];
  }

  // filter keys with dot-notation
  var matched = 0;
  var keys = [];
  for (var prop in this.cache) {
    if (this.cache.hasOwnProperty(prop)) {
      if (prop.indexOf(key) === 0) {
        keys.push(prop);
        matched++;
      }
    }
  }
  return keys;
};

/**
 * Expose `Questions`
 */

module.exports = Questions;

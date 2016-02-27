'use strict';

var async = require('async');
var use = require('use');
var util = require('util');
var debug = require('debug')('questions');
var Store = require('data-store');
var Options = require('option-cache');
var Question = require('./lib/question');
var utils = require('./lib/utils');

/**
 * Answer stores, for persisting answers across sessions
 */

var globals;
var store;
var hints;

/**
 * Answer cache, for caching answers during a session,
 * and potentially across instances
 */

var sessionAnswers = {};

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
  Options.call(this, options);
  use(this);
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
  debug('initializing question-store');
  this.inquirer = opts.inquirer || utils.inquirer();
  this.project = opts.project || utils.project(process.cwd());
  this.answers = sessionAnswers;
  this.data = opts.data || {};
  this.cache = {};
  this.queue = [];
  this.createStores(opts);
};

/**
 * Create stores for persisting data across sessions.
 *
 * - `globals`: Persist non-project-specific answers when `question.options.global` is true
 * - `store`: Persist project-specific answers
 * - `hints`: Persist project-specific hints. This is used to populate the `question.default` value.
 *
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

Questions.prototype.createStores = function(options) {
  var self = this;

  // persist answers to questions with `{ global: true }`
  utils.sync(this, 'globals', function() {
    debug('creating globals store');

    if (typeof globals === 'undefined') {
      globals = new Store('globals', { cwd: utils.resolveDir('~/') });
      debug('created globals store');
    }
    return globals;
  });

  // persist project-specific answers
  utils.sync(this, 'store', function() {
    debug('creating project store');

    if (typeof store === 'undefined') {
      store = options.store || new Store(this.project);
      debug('created project store');
    }
    return store;
  });

  // persist project-specific hints
  utils.sync(this, 'hints', function() {
    debug('creating hints store');

    if (typeof hints === 'undefined') {
      hints = self.store.create('hints');
      debug('created hints store');
    }
    return hints;
  });
};

/**
 * Calls [addQuestion](#addQuestion), with the only difference being that `.set`
 * returns the `questions` instance and `.addQuestion` returns the question object.
 * So use `.set` if you want to chain questions, or `.addQuestion` if you need
 * the created question object.
 *
 * ```js
 * questions
 *   .set('drink', 'What is your favorite beverage?')
 *   .set('color', 'What is your favorite color?')
 *   .set('season', 'What is your favorite season?');
 *
 * // or
 * questions.set('drink', {
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 *
 * // or
 * questions.set({
 *   name: 'drink'
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 * ```
 * @param {Object|String} `name` Question name, message (string), or question/options object.
 * @param {Object|String} `value` Question message (string), or question/options object.
 * @param {Object|String} `options` Question/options object.
 * @api public
 */

Questions.prototype.set = function(name, val, options) {
  this.addQuestion.apply(this, arguments);
  return this;
};

/**
 * Add a question to be asked at a later point. Creates an instance of
 * [Question](#question), so any `Question` options or settings may be used.
 * Also, the default `type` is `input` if not defined by the user.
 *
 * ```js
 * questions.addQuestion('drink', 'What is your favorite beverage?');
 *
 * // or
 * questions.addQuestion('drink', {
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 *
 * // or
 * questions.addQuestion({
 *   name: 'drink'
 *   type: 'input',
 *   message: 'What is your favorite beverage?'
 * });
 * ```
 * @param {Object|String} `name` Question name, message (string), or question/options object.
 * @param {Object|String} `value` Question message (string), or question/options object.
 * @param {Object|String} `options` Question/options object.
 * @api public
 */

Questions.prototype.addQuestion = function(name, val, options) {
  if (utils.isObject(name) && !utils.isQuestion(name)) {
    return this.visit('set', name);
  }

  var question = new Question(name, val, options);
  debug('questions#set "%s"', name);

  this.emit('set', question.name, question);
  this.cache[question.name] = question;

  utils.union(this.queue, [question.name]);
  this.run(question);
  return question;
};

/**
 * Create a "choices" question from an array of values.
 *
 * ```js
 * questions.choices('foo', ['a', 'b', 'c']);
 *
 * // or
 * questions.choices('foo', {
 *   message: 'Favorite letter?',
 *   choices: ['a', 'b', 'c']
 * });
 * ```
 * @param {String|Array} `queue` Name or array of question names.
 * @param {Object|Function} `options` Question options or callback function
 * @param {Function} `callback` callback function
 * @api public
 */

Questions.prototype.choices = function() {
  var question = utils.toChoices.apply(null, arguments);
  if (!question.hasOwnProperty('save')) {
    question.save = false;
  }
  this.set(question.name, question);
  return this;
};

/**
 * Create a "choices" question from an array of values.
 *
 * ```js
 * questions.choices('foo', ['a', 'b', 'c']);
 *
 * // or
 * questions.choices('foo', {
 *   message: 'Favorite letter?',
 *   choices: ['a', 'b', 'c']
 * });
 * ```
 * @param {String|Array} `queue` Name or array of question names.
 * @param {Object|Function} `options` Question options or callback function
 * @param {Function} `callback` callback function
 * @api public
 */

Questions.prototype.confirm = function() {
  var question = this.addQuestion.apply(this, arguments);
  question.type = 'confirm';
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
  this.answers = sessionAnswers = {};
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
  var self = this;

  async.reduce(questions, this.answers, function(answers, key, next) {
    debug('asking question "%s"', key);

    try {
      var opts = utils.merge({}, self.options, config);
      var data = utils.merge({}, self.data, opts);

      var question = self.get(key);
      var options = question.opts(opts);
      var val = question.answer(answers, data, self);
      debug('using answer %j', val);

      if (!utils.isAnswer(val) && options.enabled('global')) {
        val = this.globals.get(key);
        debug('no answer found, using global: "%s"', val);
      }

      // emit question before building options
      self.emit('ask', question, val, answers);

      // re-build options object after emitting ask, to allow
      // user to update question options from a listener
      options = question.opts(opts, question.options);
      debug('using options %j', options);

      if (options.enabled('skip')) {
        debug('skipping question "%s", using answer "%j"', key, val);
        question.next(val, self, answers, next);
        return;
      }

      var force = options.get('force');
      var isForced = force === true || utils.matchesKey(force, key);

      if (!isForced && utils.isAnswer(val)) {
        debug('question "%s", using answer "%j"', key, val);
        utils.set(answers, key, val);
        question.next(val, self, answers, next);
        return;
      }

      self.inquirer.prompt([question], function(answer) {
        debug('answered "%s" with "%j"', key, answer);

        try {
          var val = answer[key];
          if (question.type === 'checkbox') {
            val = utils.flatten(val);
          }

          if (!utils.isAnswer(val)) {
            next(null, answers);
            return;
          }

          // persist to 'project' store if 'save' is not disabled
          if (!options.disabled('save')) {
            debug('saving answer in project store: %j', val);
            self.store.set(key, val);
          }

          // persist to 'global-globals' store if 'global' is enabled
          if (options.enabled('global')) {
            debug('saving answer in global store: %j', val);
            self.globals.set(key, val);
          }

          // persist to project-specific 'hint' store, if 'hint' is not disabled
          if (!options.disabled('hint')) {
            debug('saving answer in hints store: %j', val);
            self.hints.set(key, val);
          }

          // emit answer
          self.emit('answer', question, val, answers);

          // set answer on 'answers' cache
          utils.set(answers, key, val);
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
  }, function(err, answers) {
    if (err) return cb(err);
    self.emit('answers', answers);
    cb(null, answers);
  });
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

Questions.prototype.normalize = function(name) {
  debug('normalizing %j', name);

  // get `name` from question object
  if (utils.isQuestion(name)) {
    return [name.name];
  }

  if (this.cache.hasOwnProperty(name)) {
    return [name];
  }

  // filter keys with dot-notation
  var matched = 0;
  var keys = [];
  for (var prop in this.cache) {
    if (this.cache.hasOwnProperty(prop)) {
      if (prop.indexOf(name) === 0) {
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

/*!
 * question-store <https://github.com/jonschlinkert/question-store>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var async = require('async');
var Question = require('./lib/question');
var utils = require('./lib/utils');

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
  this.options = options || {};
  this.questions = {};
  this.answers = {};
  this.queue = [];
}

/**
 * Queue up a question to be asked at a later point. Creates an
 * instance of [Question](#question), so any `Question` options or settings
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
  if (utils.isObject(name)) {
    options = val;
    val = name;
    name = val.name;
  }

  if (typeof val === 'string') {
    val = { message: val };
  }

  if (!utils.isObject(val)) {
    throw new TypeError('expected question value to be a string or object');
  }

  val = utils.extend({type: 'input'}, options, val);
  var question = new Question(name, val);
  this.questions[name] = question;
  this.answers[name] = question.data;
  this.queue.push(name);
  return this;
};

/**
 * Get the `question` instance stored for the given `name`. This is the entire
 * `Question` object, with all answers for all locales and directories.
 *
 * ```js
 * var name = questions.question('name');
 * ```
 * @param {String} `name`
 * @return {Object} Returns the question instance.
 * @api public
 */

Questions.prototype.question = function(name) {
  return this.questions[name] || {};
};

/**
 * Get the answer object for question `name`, for the current locale and cwd.
 *
 * ```js
 * var name = questions.get('name');
 * //=> {name: 'Jon'}
 *
 * // specify a locale
 * var name = questions.get('name', 'fr');
 * //=> {name: 'Jean'}
 * ```
 * @param {String} `name`
 * @param {String} `locale`
 * @return {Object} Returns the question object.
 * @api public
 */

Questions.prototype.get = function(name, locale) {
  return this.question(name).get(locale);
};

/**
 * Return true if question `name` has been answered for the current locale
 * and the current working directory.
 *
 * ```js
 * question.isAnswered(locale);
 * ```
 * @param {String} `name` Question name
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Questions.prototype.isAnswered = function(name, locale) {
  return this.question(name).isAnswered(locale);
};

/**
 * Delete the answer for question `name` for the current (or given) locale.
 *
 * ```js
 * question.del(locale);
 * ```
 * @param {String} `name` Question name
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Questions.prototype.del = function(name, locale) {
  this.question(name).del(locale);
  return this;
};

/**
 * Get the answer value for question `name`, for the current locale and cwd.
 * Similar to `questions.get`, but only returns the answer value instead
 * of the entire object.
 *
 * ```js
 * var name = questions.answer('name');
 * //=> 'Jon'
 *
 * // specify a locale
 * var name = questions.answer('name', 'fr');
 * //=> 'Jean'
 * ```
 * @param {String} `name`
 * @param {String} `locale`
 * @return {Object} Returns the question object.
 * @api public
 */

Questions.prototype.answer = function(name, locale) {
  var answer = this.get(name, locale);
  if (answer) {
    return answer[name];
  }
  return null;
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

Questions.prototype.ask = function(names, options, cb) {
  if (typeof names === 'function') {
    return this.ask(null, null, names);
  }

  if (typeof options === 'function') {
    return this.ask(names, {}, options);
  }

  if (utils.isOptions(names)) {
    options = names;
    names = null;
  }

  var opts = utils.extend({}, this.options, options);
  var keys = utils.arrayify(names || this.queue);
  var questions = this.questions;

  if (this.options.forceAll === true) {
    opts.force = true;
  }

  async.reduce(keys, {}, function(answers, key, next) {
    var question = questions[key];

    question.ask(opts, function(err, answer) {
      if (err) return next(err);
      answers[key] = answer[key];
      next(null, answers);
    });
  }, cb);
};

/**
 * Expose `Questions`
 */

module.exports = Questions;

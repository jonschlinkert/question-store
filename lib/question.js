/*!
 * question-store <https://github.com/jonschlinkert/question-store>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var use = require('use');
var path = require('path');
var utils = require('./utils');

/**
 * Create new `Question` store `name`, with the given `options`.
 *
 * ```js
 * var question = new Question(name, options);
 * ```
 * @param {String} `name` The question property name.
 * @param {Object} `options` Store options
 * @api public
 */

function Question(name, message, options) {
  if (utils.isObject(name)) {
    options = utils.merge({}, message, name);
    message = options.message;
    name = options.name;
  }

  if (utils.isObject(message)) {
    options = utils.merge({}, options, message);
    message = options.message;
  }

  utils.define(this, 'isQuestion', true);
  utils.define(this, 'cache', {});

  this.options = options || {};
  this.type = this.options.type || 'input';
  this.message = message || this.options.message;
  this.name = name || this.options.name;

  if (!this.message) {
    this.message = this.name;
  }

  utils.merge(this, this.options);
  createNext(this);
}

/**
 * Create the next question to ask, if `next` is passed on the
 * options.
 *
 * @param {Object} `app` question instance
 */

function createNext(question) {
  if (!question.options.next) return;

  if (typeof question.options.next === 'function') {
    question.next = question.options.next.bind(question);
    return;
  }

  if (typeof question.options.next === 'string') {
    question.type = 'confirm';
    question.next = function(answer, questions, answers, next) {

      if (answer === true) {
        questions.ask(question.options.next, next);
      } else {
        next(null, answers);
      }
    };
  }
}

Question.prototype.next = function(answer, questions, answers, cb) {
  cb(null, answers);
};

/**
 * Merge the given `options` object with `questions.options` and expose
 * `get`, `set` and `enabled` properties to simplify checking for options values.
 *
 * @param {Object} options
 * @return {Object}
 */

Question.prototype.opts = function(options) {
  var args = [].slice.call(arguments);
  options = [].concat.apply([], args);

  var opts = utils.omitEmpty(utils.merge.apply(utils.merge, [{}].concat(options)));
  decorate(opts);

  if (typeof opts.default !== 'undefined') {
    this.default = opts.default;
  }
  if (opts.persist === false) {
    opts.global = false;
    opts.hint = false;
    opts.save = false;
  }
  if (opts.save === false) {
    opts.force = true;
  }
  return opts;
};

Question.prototype.answer = function(cache, data, store, hints) {
  var answer = cache[this.name];
  if (typeof answer === 'undefined') {
     answer = utils.get(data, this.name);
  }
  if (typeof answer === 'undefined') {
     answer = store.get(this.name);
  }
  if (typeof answer !== 'undefined') {
    this.default = answer;
  }
  if (typeof this.default === 'undefined') {
    this.default = hints.get(this.name);
  }
  return answer;
};

Question.prototype.force = function() {
  this.options.force = true;
  return this;
};

function decorate(opts) {
  utils.define(opts, 'set', function(prop, val) {
    utils.set(this, prop, val);
    return this;
  }.bind(opts));

  utils.define(opts, 'get', function(prop) {
    return utils.get(this, prop);
  }.bind(opts));

  utils.define(opts, 'enabled', function(prop) {
    return this.get(prop) === true;
  }.bind(opts));

  utils.define(opts, 'disabled', function(prop) {
    return this.get(prop) === false;
  }.bind(opts));
}

/**
 * Expose `Question`
 */

module.exports = Question;

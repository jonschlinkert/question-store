/*!
 * question-store <https://github.com/jonschlinkert/question-store>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var util = require('util');
var Options = require('option-cache');
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
  if (!(this instanceof Questions)) {
    return new Questions(options);
  }

  Options.apply(this, arguments);
  if (this.options.force === true) {
    this.options.forceAll = true;
  }

  this.inquirer = this.options.inquirer || utils.inquirer;
  this.cache = {};
  this.paths = {};
  this.queue = [];
  this.data = {};
}

/**
 * Mixin `Emitter` methods
 */

util.inherits(Questions, Options);

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
  this.addQuestion.apply(this, arguments);
  return this;
};

/**
 * Set data to be used for answering questions, or as default answers
 * when `force` is true.
 *
 * ```js
 * questions.setData('foo', 'bar');
 * // or
 * questions.setData({foo: 'bar'});
 * ```
 * @param {String|Object} `key` Property name to set, or object to extend onto `questions.data`
 * @param {any} `val` The value to assign to `key`
 * @api public
 */

Questions.prototype.setData = function(key, val) {
  if (utils.isObject(key)) {
    return this.visit('setData', key);
  }
  utils.set(this.data, key, val);
  this.emit('data', key, val);
  return this;
};

/**
 * Return true if property `key` has a value on `questions.data`.
 *
 * ```js
 * questions.hasData('abc');
 * ```
 * @param {String} `key` The property to lookup.
 * @return {Boolean}
 * @api public
 */

Questions.prototype.hasData = function(key) {
  return utils.has(this.data, key);
};

/**
 * Get the value of property `key` from `questions.data`.
 *
 * ```js
 * questions.setData('foo', 'bar');
 * questions.getData('foo');
 * //=> 'bar'
 * ```
 * @param {String} `key` The property to get.
 * @return {any} Returns the value of property `key`
 * @api public
 */

Questions.prototype.getData = function(key) {
  return utils.get(this.data, key);
};

/**
 * Add a question that, when answered, will save the value as the default
 * value to be used for the current locale.
 *
 * ```js
 * questions.setDefault('author.name', 'What is your name?');
 * ```
 * @param {String} `name`
 * @param {Object} `val`
 * @param {Object} `options`
 * @api public
 */

Questions.prototype.setDefault = function(name, val, options) {
  var question = this.addQuestion.apply(this, arguments);
  question.options.isDefault = true;
  return this;
};

/**
 * Private method for normalizing question objects and adding them
 * to the cache.
 */

Questions.prototype.addQuestion = function(name, val, options) {
  var opts = utils.extend({}, this.options, options);
  var question = new Question(name, val, opts);
  question.cwd = this.cwd;

  this.emit('set', question.name, question);
  utils.set(this.cache, question.name, question);
  this.queue.push(question.name);
  return question;
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

Questions.prototype.get = function(name) {
  return utils.get(this.cache, name);
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
  if (arguments.length > 1 || utils.isObject(name)) {
    return this.set.apply(this, arguments);
  }
  var question = this.get(name);
  if (typeof question === 'undefined') {
    throw new Error('question-store cannot find question "' + name + '"');
  }
  return question;
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
  var question = this.question(name);
  if (question && typeof question.del === 'function') {
    question.del(locale);
    return this;
  }
  if (utils.hasQuestion(question)) {
    for (var key in question) {
      var val = question[key];
      if (val && typeof val.del === 'function') {
        val.del(locale);
      }
    }
  }
  return this;
};

/**
 * Delete answers for all questions for the current (or given) locale.
 *
 * ```js
 * question.deleteAll(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Questions.prototype.deleteAll = function(locale) {
  var len = this.queue.length;
  while (len--) {
    this.del(this.queue[len], locale);
  }
  return this;
};

/**
 * Erase all answers for question `name` from the file system.
 *
 * ```js
 * question.erase(name);
 * ```
 * @param {String} `name` Question name
 * @api public
 */

Questions.prototype.erase = function(name) {
  var question = this.question(name);
  if (question && typeof question.erase === 'function') {
    question.erase();
    return this;
  }
  if (utils.hasQuestion(question)) {
    for (var key in question) {
      var val = question[key];
      if (val && typeof val.erase === 'function') {
        val.erase();
      }
    }
  }
  return this;
};

/**
 * Erase answers for all questions from the file system.
 *
 * @return {String}
 */

Questions.prototype.eraseAll = function(name, locale) {
  var len = this.queue.length;
  while (len--) {
    this.erase(this.queue[len], locale);
  }
  return this;
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
  if (opts.forceAll === true) {
    opts.force = true;
  }

  var questions = this.buildQueue(names, opts.locale);
  var self = this;

  // force exit if "ctrl+c" is pressed
  utils.forceExit();

  setImmediate(function() {
    utils.async.reduce(questions, {}, function(answers, question, next) {
      var key = question.name;

      self.emit('ask', key, question, answers);

      question.ask(opts, function(err, answer) {
        if (err) return next(err);

        var res = utils.get(answer, key);
        self.emit('answer', key, res, question);
        utils.set(answers, key, res);

        setImmediate(function() {
          next(null, answers);
        });
      });
    }, cb);
  });
};

/**
 * Build the object of questions to ask.
 *
 * @param {Array|String} keys
 * @return {Object}
 */

Questions.prototype.buildQueue = function(keys, locale) {
  if (!keys) keys = Object.keys(this.cache);
  keys = utils.arrayify(keys);
  var len = keys.length, i = -1;
  var queue = [];
  var arr = [];

  while (++i < len) {
    var key = keys[i];
    if (utils.isObject(key) && key.isQuestion) {
      if (queue.indexOf(key.name) === -1) {
        queue.push(key.name);
        arr.push(key);
      }
      continue;
    }

    for (var j = 0; j < this.queue.length; j++) {
      var ele = this.queue[j];
      if (utils.hasKey(key, ele)) {
        var question = this.get(ele);
        if (this.hasData(ele)) {
          question.set(this.getData(ele), locale);
        }

        if (question && queue.indexOf(question.name) === -1) {
          queue.push(question.name);
          arr.push(question);
        }
      }
    }
  }
  return arr;
};

/**
 * Visit `method` over each property on the given `value`.
 *
 * @param {String} `method` The `questions` method to call.
 * @param {Object} `val`
 * @return {Object}
 */

Questions.prototype.visit = function(method, val) {
  return utils.visit(this, method, val);
};

/**
 * Getter/setter for answer cwd
 */

Object.defineProperty(Questions.prototype, 'cwd', {
  set: function(cwd) {
    this.paths.cwd = cwd;
  },
  get: function() {
    if (this.paths.cwd) {
      return this.paths.cwd;
    }
    var cwd = this.options.cwd || process.cwd();
    return (this.paths.cwd = cwd);
  }
});

/**
 * Expose `Questions`
 */

module.exports = Questions;

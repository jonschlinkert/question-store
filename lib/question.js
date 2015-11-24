/*!
 * question-store <https://github.com/jonschlinkert/question-store>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

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

function Question(name, options) {
  if (typeof name !== 'string') {
    throw new TypeError('expected the first argument to be a string');
  }
  this.cache = {};
  this.options = options || {};
  this.name = name;
  this.options.name = this.name;
  this.locale = this.options.locale || 'en';
  this.answer = new utils.Answer(name, this.options);
  this.data = this.answer.data;
}

/**
 * Update the answer to the question for the current (or given) locale,
 * at the current working directory.
 *
 * ```js
 * question.set('foo');
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.set = function(val, locale) {
  this.answers.set(val, locale);
  return this;
};

/**
 * Get the answer for the current (or given) locale for the current
 * working directory.
 *
 * ```js
 * question.get(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.get = function(locale) {
  return this.answer.get(locale);
};

/**
 * Return true if the question has been answered for the current locale
 * and the current working directory.
 *
 * ```js
 * question.isAnswered(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.isAnswered = function(locale) {
  return this.answer.has(locale);
};

/**
 * Ask the question.
 *
 * - If an answer has already been stored for the current locale and cwd it will be returned directly without asking the question.
 * - If `options.force` is **true**, the answer will be asked asked even if the answer is already stored.
 * - If `options.save` is **false**, the answer will not be persisted to the file system, and the question will be re-asked each time `.ask()` is called (which means it's also not necessary to define `force` when `save` is false).
 *
 * ```js
 * question.ask({force: true}, function(err, answer) {
 *   console.log(answer);
 * });
 * ```
 * @param {Object|Function} `options` Question options or callback function
 * @param {Function} `callback` callback function
 * @api public
 */

Question.prototype.ask = function(options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = utils.extend({locale: this.locale}, this.options, options);
  if (opts.force === true) {
    this.answer.del(opts.locale);
  }

  if (this.isAnswered(opts.locale)) {
    return cb(null, this.answer.get(opts.locale));
  }

  utils.inquirer.prompt(this.options, function(answer) {
    if (opts.save !== false) {
      this.answer.set(answer);
    }
    cb(null, answer);
  }.bind(this));
};

/**
 * Delete the answer for the current (or given) locale.
 *
 * ```js
 * question.del(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.del = function(locale) {
  this.answer.del(locale);
  return this;
};

/**
 * Persist the answer for the current locale and cwd to disk.
 *
 * ```js
 * question.save();
 * ```
 *
 * @api public
 */

Question.prototype.save = function() {
  this.answer.save();
  return this;
};

/**
 * Create the property key to use for getting and setting
 * the `default` value for the current locale.
 */

Question.prototype.defaultKey = function(locale) {
  return (locale || this.locale) + '.default';
};

/**
 * Create the property key to use for getting and setting
 * values for the current locale and cwd.
 */

Question.prototype.toKey = function(locale) {
  return utils.toKey(locale || this.locale, this.cwd);
};

/**
 * Getter/setter for answer cwd
 */

Object.defineProperty(Question.prototype, 'cwd', {
  set: function(cwd) {
    this.cache.cwd = cwd;
  },
  get: function() {
    if (this.cache.cwd) {
      return this.cache.cwd;
    }
    var cwd = this.options.cwd || process.cwd();
    return (this.cache.cwd = cwd);
  }
});

/**
 * Getter/setter for answer dest
 */

Object.defineProperty(Question.prototype, 'dest', {
  set: function(dest) {
    this.cache.dest = dest;
  },
  get: function() {
    if (this.cache.dest) {
      return this.cache.dest;
    }
    var dest = utils.resolveDir(this.options.dest || '~/answers');
    return (this.cache.dest = dest);
  }
});

/**
 * Getter/setter for answer path
 */

Object.defineProperty(Question.prototype, 'path', {
  set: function(fp) {
    this.cache.path = fp;
  },
  get: function() {
    if (this.cache.path) {
      return this.cache.path;
    }
    var fp = path.resolve(this.dest, this.name + '.json');
    return (this.cache.path = fp);
  }
});

/**
 * Getter/setter for answer path
 */

Object.defineProperty(Question.prototype, 'locale', {
  set: function(locale) {
    this.cache.locale = locale;
  },
  get: function() {
    return this.cache.locale || this.options.locale || 'en';
  }
});

/**
 * Expose `Question`
 */

module.exports = Question;

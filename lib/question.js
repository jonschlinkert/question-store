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

function Question(name, val, options) {
  if (utils.isObject(name)) {
    return new Question(name.name, name, val);
  }

  if (typeof val === 'string') {
    val = { message: val };
  }

  if (typeof name === 'string' && !val) {
    val = { message: name };
  }

  this.options = utils.merge({}, options, val);
  this.isQuestion = true;
  this.cache = {};
  this.name = name;

  this.init(this.options);
}

/**
 * Initialize defaults
 */

Question.prototype.init = function(opts) {
  opts.locale = opts.locale || 'en';
  opts.type = opts.type || 'input';
  opts.name = this.name;
  opts.message = opts.message || this.name;

  utils.define(this, 'inquirer', opts.inquirer || utils.inquirer());
  delete opts.inquirer;

  this.project = opts.project;
  this.answer = new utils.Answer(opts.project || this.name, opts);
  if (!this.project) this.project = this.answer.project;
  use(this);

  if (this.options.debug === true) return;

  this.inspect = function() {
    var msg = opts.message;
    if (msg[msg.length - 1] !== '?') msg += '?';
    var val = this.answer.get(this.locale) || 'nothing yet';
    return '<Question "' + msg + '" <' + val + '>>';
  };
};


/**
 * Return true if the question has been answered for the current locale
 * and the current working directory.
 *
 * ```js
 * question.set('foo', 'bar');
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.set = function(key, val) {
  utils.set(this, key, val);
  return this;
};

/**
 * Get `key` from the question.
 *
 * ```js
 * question.set('foo', 'bar');
 * question.get('foo');
 * //=> 'bar'
 * ```
 * @param {String} `key`
 * @api public
 */

Question.prototype.get = function(key) {
  return utils.get(this, key);
};

/**
 * Return the answer for the current locale and current working directory.
 *
 * ```js
 * question.getAnswer(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.setAnswer = function(val, locale) {
  locale = locale || this.locale;

  this.set(['cache.answer', locale], val);
  if (this.options.save !== false) {
    return this.answer.set(val, locale);
  }
  return val;
};

/**
 * Return the answer for the current locale and current working directory.
 *
 * ```js
 * question.getAnswer(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.getAnswer = function(locale) {
  locale = locale || this.locale;
  var val = this.get(['cache.answer', locale]);

  if (typeof val === 'undefined') {
    val = this.answer.get(locale);
  }
  if (typeof val === 'undefined') {
    val = this.answer.getDefault(locale);
  }
  return val;
};

/**
 * Return true if the question has been answered for the current locale
 * and the current working directory.
 *
 * ```js
 * question.hasAnswer(locale);
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.hasAnswer = function(locale) {
  return typeof this.getAnswer(locale) !== 'undefined';
};

/**
 * Return the answer for the current locale and current working directory.
 *
 * ```js
 * question.setDefault('Jon', 'en');
 * question.setDefault('Jean', 'fr');
 * ```
 * @param {String} `locale` Optionally pass a locale
 * @api public
 */

Question.prototype.setDefault = function(val, locale) {
  locale = locale || this.locale;

  this.set(['cache.default', locale], val);
  if (this.options.save !== false) {
    return this.answer.setDefault(val, locale);
  }
};

/**
 * Erase the answer for a question.
 *
 * ```js
 * question.erase();
 * question.hasAnswer();
 * //=> false
 * ```
 * @return {Boolean}
 * @api public
 */

Question.prototype.erase = function(locale) {
  this.answer.erase();
  return this;
};

/**
 * Force the question to be asked.
 *
 * ```js
 * question.options.force = true;
 * question.isForced();
 * //=> true
 * ```
 * @return {Boolean}
 * @api public
 */

Question.prototype.force = function() {
  this.options.force = true;
  return this;
};

/**
 * Return true if the question will be forced (asked even
 * if it already has an answer).
 *
 * ```js
 * question.options.force = true;
 * question.isForced();
 * //=> true
 * ```
 * @return {Boolean}
 * @api public
 */

Question.prototype.isForced = function() {
  return this.options.force === true || this.options.init === true;
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

  try {
    var opts = utils.merge({}, this.options, options);
    if (typeof opts.skip === 'undefined') {
      opts.skip = this.skip;
    }

    var answer = this.answer.get(opts.locale);
    if ((this.hasAnswer(opts.locale) || opts.skip === true) && opts.force !== true) {
      cb(null, utils.toAnswer(opts.name, answer));
      return;
    }

    if (utils.isObject(answer)) {
      opts.default = typeof answer[this.name] !== 'undefined'
        ? answer[this.name]
        : answer;
    }

    if (typeof opts.default === 'undefined' || opts.default === null) {
      delete opts.default;
    }

    var prompt = (opts.prompt || this.inquirer.prompt);

    prompt(opts, function(answer) {
      var val = answer;
      if (utils.isObject(answer)) {
        val = utils.get(answer, this.name);
      }
      if (opts.isDefault === true) {
        this.setDefault(val);
      }
      if (!opts.isDefault && val !== opts.default) {
        this.setAnswer(val);
      }

      cb(null, utils.set({}, this.name, val));
    }.bind(this));

  } catch (err) {
    cb(err);
  }
};

/**
 * Persist the answer to the file system for the current locale and cwd.
 *
 * ```js
 * question.save();
 * ```
 */

Question.prototype.save = function() {
  this.answer.save();
  return this;
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
    this.answer.dest = dest;
    this.cache.dest = dest;
  },
  get: function() {
    if (this.cache.dest) {
      return this.cache.dest;
    }
    var dest = utils.resolveDir(this.options.dest || '~/answers');
    this.answer.dest = dest;
    this.cache.dest = dest;
    return dest;
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
    var fp = path.resolve(this.dest, this.project + '.json');
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

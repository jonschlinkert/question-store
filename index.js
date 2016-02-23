/*!
 * question-store <https://github.com/jonschlinkert/question-store>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var use = require('use');
var util = require('util');
var path = require('path');
var debug = require('debug')('question-store');
var Store = require('data-store');
var Options = require('option-cache');
var Question = require('./lib/question');
var defaults = require('./lib/defaults');
var answers = require('./lib/answers');
var utils = require('./lib/utils');
var data = require('./lib/data');

/**
 * Cache answers for a session
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
  this.option(options || {});

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
  if (opts.force === true) {
    opts.forceAll = true;
  }

  this.answerCache = answerCache;
  this.inquirer = opts.inquirer || utils.inquirer;
  this.enqueued = false;
  this.groupMap = {};
  this.groups = {};
  this.cache = {};
  this.paths = {};
  this.queue = [];
  this.data = opts.data || {};

  utils.sync(this, 'answerStore', function() {
    return opts.store || new Store(opts.project || this.name);
  });

  utils.sync(this, 'defaultStore', function() {
    return new Store('defaults');
  });

  this.use(defaults());
  this.use(answers());
  this.use(data());
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
  this.addQuestion.apply(this, arguments);
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

Questions.prototype.get = function(name) {
  return this.cache[name] || this.groups[name];
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

Questions.prototype.has = function(name) {
  return !!(this.cache[name] || this.groups[name]);
};

/**
 * Delete the given question or group.
 *
 * ```js
 * questions.del('name');
 * questions.get('name');
 * //=> undefined
 * ```
 * @return {String} The name of the question to delete
 * @api public
 */

Questions.prototype.del = function(name) {
  delete this.groups[name];
  delete this.cache[name];
};

/**
 * Delete the given question or group.
 *
 * ```js
 * questions.del('name');
 * questions.get('name');
 * //=> undefined
 * ```
 * @return {String} The name of the question to delete
 * @api public
 */

Questions.prototype.clear = function() {
  this.groups = {};
  this.cache = {};
  this.queue = [];
};

Questions.prototype.force = function() {
  for (var key in this.cache) {
    if (this.cache.hasOwnProperty(key)) {
      this.cache[key].force();
    }
  }
};

/**
 * Private method for normalizing question objects and adding them
 * to the cache.
 */

Questions.prototype.addQuestion = function(name, val, options) {
  var opts = utils.merge({}, this.options, options);
  opts.project = opts.project || this.project;
  opts.path = this.path;
  opts.cwd = this.cwd;

  var question = new Question(name, val, opts);
  this.emit('set', question.name, question);
  this.cache[question.name] = question;

  utils.union(this.queue, [question.name]);
  this.group(question.name);
  this.run(question);
  return question;
};

/**
 * Delete a question.
 *
 * ```js
 * question.delQuestion(name);
 * ```
 * @param {String} `name` The question to delete.
 * @api public
 */

Questions.prototype.delQuestion = function(name) {
  if (Array.isArray(name)) {
    name.forEach(this.delQuestion.bind(this));
  } else if (this.cache.hasOwnProperty(name)) {
    var groupName = this.groupMap[name];
    if (groupName) {
      var group = this.groups[this.groupMap[name]];
      group.splice(group.indexOf(name), 1);
    }
    delete this.cache[name];
    this.unqueue(name);
  } else if (this.groups.hasOwnProperty(name)) {
    this.groups[name].forEach(this.delQuestion.bind(this));
  }
  return this;
};

/**
 * Create a question group from the given key. This is used in `addQuestion`
 * to add namespaced questions to groups.
 *
 * ```js
 * questions
 *   .set('author.name', 'Author name?')
 *   .set('author.url', 'Author url?')
 *
 * // console.log(questions.groups);
 * //=> {author: ['author.name', 'author.url']}
 * ```
 * @param {String} `key`
 * @return {Object}
 */

Questions.prototype.group = function(key) {
  var segs = key.split('.');
  var name = segs[0];
  var item = segs[1];
  if (!item) return this;

  this.groups[name] = this.groups[name] || [];
  utils.union(this.groups[name], [key]);
  this.groupMap[key] = name;
  return this;
};

/**
 * Get a group with the given `key`. If `key` has a dot, only the substring
 * before the dot is used for the lookup.
 *
 * ```js
 * questions
 *   .set('author.name', 'Author name?')
 *   .set('author.url', 'Author url?')
 *   .set('project.name', 'Project name?')
 *   .set('project.url', 'Project url?')
 *
 * var group = questions.getGroup('author');
 * //=> ['author.name', 'author.url']
 *
 * questions.ask(group, function(err, answers) {
 *   // do stuff with answers
 * });
 * ```
 * @param {String} `key`
 * @return {Object}
 * @api public
 */

Questions.prototype.getGroup = function(key) {
  return this.groups[key.split('.').shift()];
};

/**
 * Clear cached answer data. Note that this will not clear answers
 * that are persisted to the file system, or answers stored on a
 * question. It only clears cached answers on `questions`.
 *
 * ```js
 * questions.clearCache();
 * ```
 * @api public
 */

Questions.prototype.clearCache = function() {
  answerCache = {};
  this.data = {};
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
  var question = this.get(name);
  if (question && typeof question.answer.erase === 'function') {
    question.answer.erase();
    return this;
  }

  if (utils.hasQuestion(question)) {
    for (var key in question) {
      var val = question[key];
      if (val && typeof val.erase === 'function') {
        val.answer.erase();
      }
    }
  }
  return this;
};

/**
 * Erase answers for all queued questions from the file system.
 *
 * @return {String}
 */

Questions.prototype.eraseAll = function() {
  var name;
  while ((name = this.queue.shift())) {
    this.erase(name);
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

  var opts = utils.merge({}, this.options, options);
  if (opts.forceAll === true) {
    opts.force = true;
  }

  names = names || this.queue;
  var questions = this.buildQueue(names, opts.locale);
  var self = this;

  utils.async.eachSeries(questions, function(question, next) {
    self.setData(answerCache);
    var key = question.name;

    debug('asking "%s":', key);

    var questOpts = utils.merge({}, opts, question.options);
    var answer = getAnswer(self, question);
    question.options.default = answer;

    if (questOpts.save === false) {
      answer = null;
    }

    var isAnswered = utils.isAnswer(answer);

    if ((question.skip === true || !questOpts.force) && isAnswered) {
      debug('skipping question "%s"', key, answer);

      updateAnswers(self, question, answer, questOpts);
      self.emit('ask', key, question, answer, answerCache);
      question.next(answer, self, next);
      return;
    }

    self.emit('ask', key, question, answer, answerCache);

    question.ask(questOpts, function(err, answer) {
      if (err) return next(err);

      debug('answered question "%s"', key, answer);

      var val = utils.get(answer, key);
      updateAnswers(self, question, val, questOpts);

      self.emit('answer', key, question, val, answerCache);
      question.next(val, self, next);
    });

  }, function(err) {
    if (err) return cb(err);
    cb(null, answerCache);
  });
};

function getAnswer(app, question) {
  var answer = question.getAnswer();
  var key = question.name;
  if (!utils.isAnswer(answer)) {
    answer = question.options.default;
  }
  if (!utils.isAnswer(answer)) {
    answer = app.getData(key);
  }
  if (!utils.isAnswer(answer)) {
    answer = utils.get(app.answerCache, key);
  }
  if (!utils.isAnswer(answer)) {
    answer = app.answerStore.get(key);
  }
  if (!utils.isAnswer(answer)) {
    answer = app.defaultStore.get(key);
  }
  return answer;
}

function updateAnswers(app, question, answer, opts) {
  if (utils.isAnswer(answer)) {
    utils.set(app.answerCache, question.name, answer);
    app.setData(app.answerCache);
    app.defaultStore.set(app.answerCache);

    if (opts.save !== false) {
      app.answerStore.set(app.answerCache);
      question.answer.set(answer);
    }
  }
}

/**
 * Build the object of questions to ask.
 *
 * @param {Array|String} keys
 * @return {Object}
 */

Questions.prototype.buildQueue = function(keys, locale) {
  if (!keys) keys = this.queue;
  keys = utils.arrayify(keys);

  var len = keys.length, i = -1;
  var queue = [];
  var arr = [];

  while (++i < len) {
    var val = keys[i];

    if (typeof val === 'string') {
      val = this.get(val);

      // if `val` is a question group, re-build it
      if (Array.isArray(val)) {
        return this.buildQueue(val, locale);
      }
    }

    if (utils.isObject(val) && val.isQuestion) {
      if (queue.indexOf(val.name) === -1) {
        queue.push(val.name);
        arr.push(val);
      }

    } else {

      for (var j = 0; j < this.queue.length; j++) {
        var name = this.queue[j];
        if (utils.hasKey(val, name)) {
          var question = this.get(name);

          // if data was set on `questions` for this question,
          // transfer the data over to the question
          if (this.hasData(name)) {
            question.set(this.getData(name), locale);
          }

          if (question && queue.indexOf(question.name) === -1) {
            queue.push(question.name);
            arr.push(question);
          }
        }
      }
    }
  }
  return arr;
};

/**
 * Get a the index of question `name` from the queue.
 *
 * ```js
 * questions.getIndex('author');
 * //=> 1
 * ```
 * @param {String} `name`
 * @return {Object}
 * @api public
 */

Questions.prototype.getIndex = function(name) {
  if (utils.isObject(name)) {
    return this.queue.indexOf(name.name);
  }
  return this.queue.indexOf(name);
};

/**
 * Enqueue one or more questions to be asked.
 *
 * @return {String}
 */

Questions.prototype.enqueue = function(names, options) {
  names = [].concat.apply([], [].slice.call(arguments));
  if (utils.isObject(names[names.length - 1])) {
    options = names.pop();
  }

  options = options || {};
  var len = names.length, i = -1;
  var res = [];

  // make sure `force` is defined on all enqueued questions
  while (++i < len) {
    var arr = utils.arrayify(this.groups[names[i]] || names[i]);
    if (options.force === true) {
      for (var j = 0; j < arr.length; j++) {
        var question = this.get(arr[j]);
        question.options.force = true;
      }
    }
    res = res.concat(arr);
  }

  // clear the queue if this is the first time `enqueue` is called
  if (!this.enqueued) {
    this.enqueued = true;
    this.queue = [];
  }

  this.queue = utils.union(this.queue, res);
  return this;
};

/**
 * Remove a question from the queue.
 *
 * ```js
 * console.log(questions.queue);
 * //=> ['a', 'b', 'c'];
 * questions.unqueue('a');
 * ```
 * @param {Object} `items` Object of views
 * @api public
 */

Questions.prototype.unqueue = function(name) {
  if (Array.isArray(name)) {
    name.forEach(this.unqueue.bind(this));
  } else if (typeof name === 'string') {
    this.queue.splice(this.getIndex(name), 1);
  } else {
    this.queue = [];
  }
  return this;
};

/**
 * Visit `method` over each property on the given `value`.
 *
 * @param {String} `method` The `questions` method to call.
 * @param {Object} `val`
 * @return {Object}
 */

Questions.prototype.mixin = function(key, val) {
  Questions.prototype[key] = val;
  return this;
};

/**
 * Visit `method` over each property on the given `value`.
 *
 * @param {String} `method` The `questions` method to call.
 * @param {Object} `val`
 * @return {Object}
 */

Questions.prototype.define = function(key, val) {
  utils.define(this, key, val);
  return this;
};

/**
 * Visit `method` over each property on the given `value`.
 *
 * @param {String} `method` The `questions` method to call.
 * @param {Object} `val`
 * @return {Object}
 */

Questions.prototype.visit = function(method, val) {
  utils.visit(this, method, val);
  return this;
};

/**
 * Getter/setter for answer dest
 */

Object.defineProperty(Questions.prototype, 'path', {
  set: function(filepath) {
    this.paths.path = filepath;
  },
  get: function() {
    var filepath = this.paths.path;
    if (filepath) {
      return filepath;
    }

    if (this.options.path) {
      filepath = path.resolve(utils.resolveDir(this.options.path));
      return (this.paths.path = filepath);
    }

    var dir = utils.resolveDir('~/answers');
    filepath = path.resolve(dir, this.name);
    return (this.paths.path = filepath);
  }
});

/**
 * Getter/setter for answer cwd
 */

Object.defineProperty(Questions.prototype, 'name', {
  set: function(name) {
    this.paths.name = name;
  },
  get: function() {
    if (this.paths.name) {
      return this.paths.name;
    }
    var name = this.options.name || this.options.project || utils.project(this.cwd);
    return (this.paths.name = name);
  }
});

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

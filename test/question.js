'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var utils = require('../lib/utils');
var Question = require('../lib/question');
var question;

var dir = utils.resolveDir('~/answers');

function json(filename) {
  return require(path.resolve(dir, filename));
}

describe('Question', function() {
  beforeEach(function() {
    question = new Question('name');
  });

  afterEach(function() {
    question.answer.erase();
  });

  describe('instance', function() {
    it('should create an instance of Question', function() {
      assert(question instanceof Question);
    });

    it('should expose a "answer" property', function() {
      assert(question.answer);
      assert.equal(typeof question.answer, 'object');
    });

    it('should expose a "set" method', function() {
      assert.equal(typeof question.answer.set, 'function');
    });

    it('should expose a "get" method', function() {
      assert.equal(typeof question.answer.get, 'function');
    });

    it('should expose a "del" method', function() {
      assert.equal(typeof question.answer.del, 'function');
    });

    it('should expose a "hasAnswer" method', function() {
      assert.equal(typeof question.hasAnswer, 'function');
    });
  });

  describe('cwd', function() {
    it('should use process.cwd() by default', function() {
      assert.equal(question.cwd, process.cwd());
    });

    it('should use cwd defined on the constructor options', function() {
      question = new Question('name', {cwd: 'foo'})
      assert.equal(question.cwd, 'foo');
    });

    it('should update the cwd when directly defined', function() {
      question = new Question('name', {cwd: 'foo'});
      question.cwd = 'bar';
      assert.equal(question.cwd, 'bar');
    });
  });

  describe('set', function() {
    beforeEach(function() {
      question = new Question('name', {debug: true});
    });

    it('should set a value on [locale][cwd]', function() {
      question.answer.set('foo');
      assert(question.answer.data.projects.en[question.project]);
    });

    it('should set a value on the default locale, "en"', function() {
      question.answer.set('foo');
      assert(question.answer.data.projects.en[question.project]);
    });

    it('should set a value on the specified locale', function() {
      question.answer.set('bar', 'es');
      assert(question.answer.data.projects.es[question.project]);
      assert.equal(question.answer.data.projects.es[question.project], 'bar');
    });
  });

  describe('get', function() {
    it('should get a value', function() {
      question.answer.set('foo');
      assert(question.answer.get() === 'foo');
    });

    it('should get a value on the default locale, "en"', function() {
      question.answer.set('foo');
      assert(question.answer.get() === 'foo');
    });

    it('should get a value on the specified locale', function() {
      question.answer.set('a', 'es');
      question.answer.set('b', 'en');
      assert(question.answer.get() === 'b');
      assert(question.answer.get('es') === 'a');
    });
  });

  describe('answer.getDefault', function() {
    it('should get a default value', function() {
      question.answer.setDefault('abc');
      question.answer.set('foo');
      assert(question.answer.getDefault() === 'abc');
    });

    it('should get a default value on the specified locale', function() {
      question.answer.setDefault('a', 'es');
      question.answer.setDefault('b', 'en');
      assert(question.answer.getDefault() === 'b');
      assert(question.answer.getDefault('es') === 'a');
    });
  });

  describe('isForced', function() {
    it('should return true if the question will be forced', function() {
      question.answer.set('foo');
      assert(question.hasAnswer());
    });
  });

  describe('has', function() {
    it('should return true if a value has been set for the cwd', function() {
      question.answer.set('foo');
      assert(question.hasAnswer());
    });

    it('should return true if a value has been set for the default locale', function() {
      question.answer.set('foo');
      assert(question.hasAnswer());
    });

    it('should return true if a default value has been set', function() {
      question.answer.set('foo');
      question.answer.setDefault('bar');
      assert(question.answer.hasDefault());
    });

    it('should return false if a default value has not been set', function() {
      question.answer.set('foo');
      assert(!question.answer.hasDefault());
    });

    it('should return false if a value has not been set for the default locale', function() {
      assert(!question.hasAnswer());
    });

    it('should return true if a value has been set for the given locale', function() {
      question.answer.set('foo', 'es');
      assert(question.hasAnswer('es'));
    });

    it('should return false if a value has not been set for the given locale', function() {
      question.answer.set('foo');
      assert(!question.hasAnswer('es'));
    });

    it('should return true if a default value has been set for a locale', function() {
      question.answer.setDefault('bar', 'es');
      assert(question.answer.hasDefault('es'));
    });

    it('should return false if a default value has not been set for a locale', function() {
      question.answer.setDefault('baz');
      assert(!question.answer.hasDefault('es'));
    });
  });

  describe('ask', function() {
    beforeEach(function() {
      question = new Question('name', {
        message: 'What is your name?'
      });
    });

    afterEach(function() {
      question.answer.erase();
    });

    it('should pass the question object to inquirer', function(cb) {
      question = new Question('name', {
        message: 'What is your name?',
        // mock inquirer
        inquirer: {
          prompt: function(question) {
            assert(question);
            assert.equal(question.type, 'input');
            assert.equal(question.name, 'name');
            assert.equal(question.message, 'What is your name?');
            cb();
          }
        }
      });

      question.ask(function() {
      });
    });

    it('should not ask a question that has an answer', function(cb) {
      question.answer.set('Jon');

      question.ask(function(err, answer) {
        assert(!err);
        assert(answer);
        assert(answer.name);
        assert.equal(answer.name, 'Jon');
        cb();
      });
    });

    it('should ask a question when options.force is true', function(cb) {
      question.ask = function(cb) {
        cb(null, 'slslslslslsl');
      };

      question.answer.set('Jon');
      question.options.force = true;

      question.ask(function(err, answer) {
        assert(!err);
        assert(answer);
        assert(answer === 'slslslslslsl');
        cb();
      });
    });

    it('should ask nested questions', function(cb) {
      question = new Question('author.name', {
        message: 'What is your name?',
        inquirer: {
          prompt: function(question, next) {
            assert(question);
            assert.equal(question.type, 'input');
            assert.equal(question.name, 'author.name');
            assert.equal(question.message, 'What is your name?');
            next('Foo');
          }
        }
      });

      question.ask(function(err, answers) {
        assert(answers.author.name === 'Foo');
        cb();
      });
    });
  });
});


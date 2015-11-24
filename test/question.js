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
    question.erase();
  });

  describe('instance', function() {
    it('should create an instance of Question', function() {
      assert(question instanceof Question);
    });

    it('should expose a "data" property', function() {
      assert(question.data);
      assert.equal(typeof question.data, 'object');
    });

    it('should expose a "set" method', function() {
      assert.equal(typeof question.set, 'function');
    });

    it('should expose a "get" method', function() {
      assert.equal(typeof question.get, 'function');
    });

    it('should expose a "del" method', function() {
      assert.equal(typeof question.del, 'function');
    });

    it('should expose a "isAnswered" method', function() {
      assert.equal(typeof question.isAnswered, 'function');
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
    it('should set a value on [locale][cwd]', function() {
      question.set('foo');
      assert(question.data.en[process.cwd()]);
    });

    it('should set a value on the default locale, "en"', function() {
      question.set('foo');
      assert(question.data.en[process.cwd()]);
    });

    it('should set a value on the specified locale', function() {
      question.set('bar', 'es');
      assert(question.data.es[process.cwd()]);
      assert.equal(question.data.es[process.cwd()], 'bar');
    });
  });

  describe('has', function() {
    it('should return true if a value has been set for the cwd', function() {
      question.set('foo');
      assert(question.isAnswered());
    });

    it('should return true if a value has been set for the default locale', function() {
      question.set('foo');
      assert(question.isAnswered());
    });

    it('should return true if a default value has been set', function() {
      question.set('foo');
      question.setDefault('bar');
      assert(question.hasDefault());
    });

    it('should return false if a default value has not been set', function() {
      question.set('foo');
      assert(!question.hasDefault());
    });

    it('should return false if a value has not been set for the default locale', function() {
      assert(!question.isAnswered());
    });

    it('should return true if a value has been set for the given locale', function() {
      question.set('foo', 'es');
      assert(question.isAnswered('es'));
    });

    it('should return false if a value has not been set for the given locale', function() {
      question.set('foo');
      assert(!question.isAnswered('es'));
    });

    it('should return true if a default value has been set for a locale', function() {
      question.setDefault('bar', 'es');
      assert(question.hasDefault('es'));
    });

    it('should return false if a default value has not been set for a locale', function() {
      question.setDefault('baz');
      assert(!question.hasDefault('es'));
    });
  });

  describe('ask', function() {
    beforeEach(function() {
      question = new Question('name', {
        message: 'What is your name?'
      });
    });

    afterEach(function() {
      question.erase();
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
      question.set('Jon');

      question.ask(function(err, answer) {
        assert(!err);
        assert(answer);
        assert(answer === 'Jon');
        cb();
      });
    });

    it('should ask a question when options.force is true', function(cb) {
      question.ask = function(cb) {
        cb(null, 'slslslslslsl');
      };

      question.set('Jon');
      question.options.force = true;

      question.ask(function(err, answer) {
        assert(!err);
        assert(answer);
        assert(answer === 'slslslslslsl');
        cb();
      });
    });
  });
});


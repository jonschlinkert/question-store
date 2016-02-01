'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var utils = require('../lib/utils');
var Questions = require('..');
var questions;

var dir = utils.resolveDir('~/answers');

function json(filename) {
  return require(path.resolve(dir, filename));
}

describe('Questions', function() {
  beforeEach(function() {
    questions = new Questions({debug: true});
    questions.cache = {};
  });

  describe('instance', function() {
    it('should create an instance of Questions', function() {
      assert(questions instanceof Questions);
    });

    it('should expose an "data" property', function() {
      assert(questions.data);
      assert.equal(typeof questions.data, 'object');
    });

    it('should expose a "questions" property', function() {
      assert(questions.cache);
      assert.equal(typeof questions.cache, 'object');
    });

    it('should expose a "queue" property', function() {
      assert(questions.queue);
      assert(Array.isArray(questions.queue));
    });

    it('should expose a "set" method', function() {
      assert.equal(typeof questions.set, 'function');
    });

    it('should expose a "get" method', function() {
      assert.equal(typeof questions.get, 'function');
    });

    it('should expose a "del" method', function() {
      assert.equal(typeof questions.del, 'function');
    });

    it('should expose a "hasAnswer" method', function() {
      assert.equal(typeof questions.hasAnswer, 'function');
    });
  });

  describe('cwd', function() {
    it('should use process.cwd() by default', function() {
      assert.equal(questions.cwd, process.cwd());
    });

    it('should use cwd defined on the constructor options', function() {
      questions = new Questions({cwd: 'foo'})
      assert.equal(questions.cwd, 'foo');
    });

    it('should update the cwd when directly defined', function() {
      questions = new Questions({cwd: 'foo'});
      questions.cwd = 'bar';
      assert.equal(questions.cwd, 'bar');
    });
  });

  describe('set', function() {
    afterEach(function() {
      questions.erase('foo');
    });

    describe('properties', function() {
      it('should add a property to "questions"', function() {
        questions.set('foo');
        assert(questions.cache.foo);
      });
    });

    describe('set > key as a string', function() {
      it('should set the question name', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.name', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.options.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.options.message, 'foo');
      });

      it('should set the question options.type', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.options.type, 'input');
      });
    });

    describe('set > key as an object', function() {
      it('should set the question name', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.name', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.options.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.options.message, 'foo');
      });

      it('should set the question options.type', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.options.type, 'input');
      });
    });

    describe('set > key and value as objects', function() {
      it('should set the question name', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.name', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.options.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.options.message, 'bar');
      });

      it('should set the question options.type', function() {
        questions.set({name: 'foo'}, {message: 'bar', type: 'baz'});
        assert.equal(questions.cache.foo.options.type, 'baz');
      });
    });

    describe('set > value as a string', function() {
      it('should set the question options.message', function() {
        questions.set('foo', 'bar');
        assert.equal(questions.cache.foo.options.message, 'bar');
      });

      it('should set the question options.type', function() {
        questions.set('foo', 'bar');
        assert.equal(questions.cache.foo.options.type, 'input');
      });
    });

    describe('set > value as an object', function() {
      it('should set the question options.message', function() {
        questions.set('foo', { message: 'bar' });
        assert.equal(questions.cache.foo.options.message, 'bar');
      });

      it('should set the question options.type', function() {
        questions.set('foo', { message: 'bar' });
        assert.equal(questions.cache.foo.options.type, 'input');
      });
    });

    describe('set > options object', function() {
      it('should set force=true on question options', function() {
        questions.set('foo', { message: 'bar' }, { force: true });
        assert.equal(questions.cache.foo.options.force, true);
      });

      it('should set save=false on question options', function() {
        questions.set('foo', { message: 'bar' }, { save: false });
        assert.equal(questions.cache.foo.options.save, false);
      });
    });
  });

  describe('delQuestion', function() {
    it('should delete a question', function() {
      questions.set('foo', 'What is foo?');
      questions.set('bar', 'What is bar?');
      assert(questions.cache.foo);
      assert(questions.cache.bar);
      questions.delQuestion('bar');
      assert(questions.cache.foo);
      assert(!questions.cache.bar);
    });

    it('should remove a question name from the queue', function() {
      questions.set('foo', 'What is foo?');
      questions.set('bar', 'What is bar?');
      assert(questions.queue.indexOf('foo') === 0);
      assert(questions.queue.indexOf('bar') === 1);

      questions.delQuestion('bar');

      assert(questions.queue.indexOf('foo') === 0);
      assert(questions.queue.indexOf('bar') === -1);
    });
  });

  describe('has', function() {
    beforeEach(function() {
      questions = new Questions({debug: true});
      questions.set('foo');
      questions.set('bar');
      questions.set('baz');
      questions.set('qux');
    });

    afterEach(function(cb) {
      questions.erase('foo');
      questions.erase('bar');
      questions.erase('baz');
      questions.erase('qux');
      cb();
    });

    it('should return true if an answer has been given for the cwd', function() {
      var question = questions.get('foo');
      question.answer.set('bar');

      assert(questions.hasAnswer('foo'));
      question.answer.del();
    });

    it('should return false if an answer has not been given for the cwd', function() {
      assert(!questions.hasAnswer('bar'));
      questions.setAnswer('bar', 'yyy');
      assert(questions.hasAnswer('bar'));
    });

    it('should return true if a value has been set for the default locale', function() {
      questions.set('baz');
      questions.get('baz')
        .answer.setDefault('bar');

      assert(questions.hasAnswer('baz'));
    });

    it('should return false if a default value has not been set', function() {
      questions.set('qux');
      assert(!questions.hasAnswer('qux'));
    });;
  });
});

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
    questions = new Questions();
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

    it('should expose a "isAnswered" method', function() {
      assert.equal(typeof questions.isAnswered, 'function');
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

  describe('data', function() {
    afterEach(function() {
      questions.data = {};
    });

    describe('setData', function() {
      it('should set a property on `question.data`', function() {
        questions.setData('a', 'b');
        assert(questions.data.a);
        assert.equal(questions.data.a, 'b');
      });

      it('should set an object on `question.data`', function() {
        questions.setData({c: 'd'});
        assert(questions.data.c);
        assert.equal(questions.data.c, 'd');
      });
    });

    describe('hasData', function() {
      it('should return true if a property is on `question.data`', function() {
        questions.setData('a', 'b');
        assert.equal(questions.hasData('a'), true);
      });

      it('should return false if a property is not on `question.data`', function() {
        questions.setData('a', 'b');
        assert.equal(questions.hasData('zzz'), false);
      });
    });

    describe('setData', function() {
      it('should get a property from `question.data`', function() {
        questions.setData('a', 'b');
        assert.equal(questions.getData('a'), 'b');
      });
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

  describe.skip('has', function() {
    it('should return true if an answer has been given for the current directory', function() {
      questions.set('foo');
      var question = questions.get('foo');
      assert(questions.isAnswered('foo'));
    });

    it('should return true if a value has been set for the default locale', function() {
      questions.set('foo');
      assert(questions.isAnswered('foo'));
    });

    it('should return true if a default value has been set', function() {
      questions.set('foo');
      questions.setDefault('bar');
      assert(questions.hasDefault('bar'));
    });

    it('should return false if a default value has not been set', function() {
      questions.set('foo');
      assert(!questions.hasDefault());
    });

    it('should return false if a value has not been set for the default locale', function() {
      assert(!questions.isAnswered());
    });

    it('should return true if a value has been set for the given locale', function() {
      questions.set('foo', 'es');
      assert(questions.isAnswered('es'));
    });

    it('should return false if a value has not been set for the given locale', function() {
      questions.set('foo');
      assert(!questions.isAnswered('es'));
    });

    it('should return true if a default value has been set for a locale', function() {
      questions.setDefault('bar', 'es');
      assert(questions.hasDefault('es'));
    });

    it('should return false if a default value has not been set for a locale', function() {
      questions.setDefault('baz');
      assert(!questions.hasDefault('es'));
    });
  });
});

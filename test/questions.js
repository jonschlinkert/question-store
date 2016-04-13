'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var Questions = require('..');
var utils = require('../lib/utils');
var home = require('os-homedir');
var questions;

function json(filename) {
  return require(path.resolve(home(), filename));
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
  });

  describe('set', function() {
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

      it('should set the question name', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.message, 'foo');
      });

      it('should set the question type', function() {
        questions.set('foo');
        assert.equal(questions.cache.foo.type, 'input');
      });
    });

    describe('set > key as an object', function() {
      it('should set the question name', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question name', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.message, 'foo');
      });

      it('should set the question type', function() {
        questions.set({name: 'foo'});
        assert.equal(questions.cache.foo.type, 'input');
      });
    });

    describe('set > key and value as objects', function() {
      it('should set the question name', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question name', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.name, 'foo');
      });

      it('should set the question options.message', function() {
        questions.set({name: 'foo'}, {message: 'bar'});
        assert.equal(questions.cache.foo.message, 'bar');
      });

      it('should set the question type', function() {
        questions.set({name: 'foo'}, {message: 'bar', type: 'baz'});
        assert.equal(questions.cache.foo.type, 'baz');
      });
    });

    describe('set > value as a string', function() {
      it('should set the question options.message', function() {
        questions.set('foo', 'bar');
        assert.equal(questions.cache.foo.message, 'bar');
      });

      it('should set the question type', function() {
        questions.set('foo', 'bar');
        assert.equal(questions.cache.foo.type, 'input');
      });
    });

    describe('set > value as an object', function() {
      it('should set the question options.message', function() {
        questions.set('foo', { message: 'bar' });
        assert.equal(questions.cache.foo.message, 'bar');
      });

      it('should set the question type', function() {
        questions.set('foo', { message: 'bar' });
        assert.equal(questions.cache.foo.type, 'input');
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
});

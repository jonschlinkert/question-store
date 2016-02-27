'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var utils = require('../lib/utils');
var Question = require('../lib/question');
var resolveDir = require('resolve-dir');
var question;

var dir = resolveDir('~/answers');

function json(filename) {
  return require(path.resolve(dir, filename));
}

describe('Question', function() {
  beforeEach(function() {
    question = new Question('name');
  });

  describe('instance', function() {
    it('should create an instance of Question', function() {
      assert(question instanceof Question);
    });
  });
});


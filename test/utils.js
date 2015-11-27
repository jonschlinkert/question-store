'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var utils = require('../lib/utils');

describe('utils', function() {
  describe('hasKey', function() {
    it('should return true if substring is in string', function() {
      assert(utils.hasKey('author', 'author.name'));
      assert(utils.hasKey('author', 'author'));
    });

    it('should return false if substring is not in string', function() {
      assert(!utils.hasKey('author', 'foo'));
      assert(!utils.hasKey('author', '_author'));
    });
  });
});


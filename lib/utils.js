'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('lazy-cache')(require);
var fn = require;

/**
 * Lazily required module dependencies
 */

require = utils;
require('extend-shallow', 'extend');
require('answer-store', 'Answer');
require('isobject', 'isObject');
require('set-value', 'set');
require('get-value', 'get');
require('resolve-dir');
require('inquirer');
require = fn;

/**
 * Cast val to an array
 */

utils.arrayify = function(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

/**
 * Create the key to use for getting and setting values.
 * If the key contains a filepath, and the filepath has
 * dots in it, we need to escape them to ensure that
 * `set-value` doesn't split on those dots.
 */

utils.toKey = function(fp, key) {
  if (typeof fp !== 'string') {
    throw new TypeError('expected fp to be a string');
  }
  fp = fp.split('.').join('\\.');
  return fp + (key ? ('.' + key) : '');
};

/**
 * Returns true if a value is an object and appears to be an
 * options object.
 */

utils.isOptions = function(val) {
  if (!utils.isObject(val)) {
    return false;
  }
  if (val.hasOwnProperty('locale')) {
    return true;
  }
  if (val.hasOwnProperty('force')) {
    return true;
  }

  if (val.hasOwnProperty('type')) {
    return false;
  }
  if (val.hasOwnProperty('message')) {
    return false;
  }
  if (val.hasOwnProperty('choices')) {
    return false;
  }
  if (val.hasOwnProperty('name')) {
    return false;
  }
};

/**
 * Expose `utils`
 */

module.exports = utils;

'use strict';

var utils = require('lazy-cache')(require);
var fn = require;

/**
 * Lazily required module dependencies
 */

require = utils;
require('arr-union', 'union');
require('async');
require('inquirer2', 'inquirer');

// object
require('define-property', 'define');
require('get-value', 'get');
require('has-value', 'has');
require('is-primitive');
require('isobject', 'isObject');
require('mixin-deep', 'merge');
require('omit-empty');
require('set-value', 'set');

// path/fs
require('project-name', 'project');
require('resolve-dir');
require = fn;

utils.sync = function(obj, prop, val) {
  utils.define(obj, prop, {
    configurable: true,
    enumerable: true,
    set: function(v) {
      utils.define(obj, prop, v);
    },
    get: function() {
      if (typeof val === 'function') {
        return val.call(obj);
      }
      return val;
    }
  });
};

utils.isAnswer = function(answer) {
  if (utils.isPrimitive(answer)) {
    return utils.has(answer);
  }
  return utils.has(utils.omitEmpty(answer));
};

utils.isEmpty = function(answer) {
  return !utils.isAnswer(answer);
};

utils.matchesKey = function(prop, key) {
  if (typeof key !== 'string' || typeof prop !== 'string') {
    return false;
  }
  if (prop === key) {
    return true;
  }
  var len = prop.length;
  var ch = key.charAt(len);
  return key.indexOf(prop) === 0 && ch === '.';
};

/**
 * Force exit if "ctrl+c" is pressed
 */

utils.forceExit = function() {
  var stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.setMaxListenders(0);
  stdin.on('data', function(key) {
    if (key === '\u0003') {
      process.stdout.write('\u001b[1A');
      process.exit();
    }
  });
};

/**
 * Cast val to an array
 */

utils.arrayify = function(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

/**
 * Returns true if a value is an object and appears to be a
 * question object.
 */

utils.isQuestion = function(val) {
  return utils.isObject(val) && (val.isQuestion || !utils.isOptions(val));
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

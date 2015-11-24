'use strict';

var Answer = require('..');
var answer = new Answer('first-name', {locale: 'fr'});

answer.setDefault('Jon');

answer.set('Jon');
answer.set('Jean', 'fr');
answer.set('Hugo', 'es');

console.log(answer.get());

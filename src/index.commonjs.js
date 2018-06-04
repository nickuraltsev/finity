/* eslint-disable */
'use strict';

var Finity = require('./Finity').default;

Object.assign(exports, Finity);

// Allow the use of the default import syntax in TypeScript (import Finity from 'finity')
exports.default = Finity;

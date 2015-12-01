'use strict';

export default function delegateToAncestor(...ancestorTypes) {
  return currentType => ancestorTypes.forEach(ancestorType =>
    createMethods(currentType, ancestorType));
}

function createMethods(currentType, ancestorType) {
  return Object.getOwnPropertyNames(ancestorType.prototype)
    .filter(name =>
      ancestorType.prototype[name] instanceof Function &&
      ancestorType.prototype[name] !== ancestorType.prototype.constructor
    )
    .forEach(name =>
      currentType.prototype[name] = function(...args) {
        const method = ancestorType.prototype[name];
        return method.apply(this.getAncestor(ancestorType), args);
      }
    );
}

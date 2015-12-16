export default function delegateToAncestor(...ancestorTypes) {
  return currentType => ancestorTypes.forEach(ancestorType =>
    Object.getOwnPropertyNames(ancestorType.prototype)
      .filter(name =>
        ancestorType.prototype[name] instanceof Function &&
        ancestorType.prototype[name] !== ancestorType.prototype.constructor
      )
      .forEach(name =>
        currentType.prototype[name] = function (...args) {
          const method = ancestorType.prototype[name];
          return method.apply(this.getAncestor(ancestorType), args);
        }
      )
  );
}

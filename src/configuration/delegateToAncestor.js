export default function delegateToAncestor(type, ancestorType) {
  Object.getOwnPropertyNames(ancestorType.prototype)
    .filter(name =>
      ancestorType.prototype[name] instanceof Function &&
      ancestorType.prototype[name] !== ancestorType.prototype.constructor
    )
    .forEach(name =>
      type.prototype[name] = function (...args) {
        const method = ancestorType.prototype[name];
        return method.apply(this.getAncestor(ancestorType), args);
      }
    );
}

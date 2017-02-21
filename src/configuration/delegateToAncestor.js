export default function delegateToAncestor(constructor, ancestorConstructor) {
  const prototype = constructor.prototype;
  const ancestorPrototype = ancestorConstructor.prototype;
  Object.getOwnPropertyNames(ancestorPrototype)
    .filter(name =>
      !prototype[name] &&
      ancestorPrototype[name] instanceof Function &&
      ancestorPrototype[name] !== ancestorConstructor
    )
    .forEach(name => {
      // eslint-disable-next-line func-names
      prototype[name] = function (...args) {
        const method = ancestorPrototype[name];
        return method.apply(this.getAncestor(ancestorConstructor), args);
      };
    });
}

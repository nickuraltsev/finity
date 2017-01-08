import mapValues from '../utils/mapValues';

export function delegateToAncestor(type, ancestorType) {
  Object.getOwnPropertyNames(ancestorType.prototype)
    .filter(name =>
      !type.prototype[name] &&
      ancestorType.prototype[name] instanceof Function &&
      ancestorType.prototype[name] !== ancestorType.prototype.constructor
    )
    .forEach(name => {
      // eslint-disable-next-line func-names
      type.prototype[name] = function (...args) {
        const method = ancestorType.prototype[name];
        return method.apply(this.getAncestor(ancestorType), args);
      };
    });
}

const internalGetConfig = configurator => configurator.internalGetConfig();

export function mapToConfig(configurators) {
  return Array.isArray(configurators) ?
    configurators.map(internalGetConfig) :
    mapValues(configurators, internalGetConfig);
}

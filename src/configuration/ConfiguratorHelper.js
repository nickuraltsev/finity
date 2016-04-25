import mapValues from '../utils/mapValues';

export function delegateToAncestor(type, ancestorType) {
  Object.getOwnPropertyNames(ancestorType.prototype)
    .filter(name =>
      !type.prototype[name] &&
      ancestorType.prototype[name] instanceof Function &&
      ancestorType.prototype[name] !== ancestorType.prototype.constructor
    )
    .forEach(name => {
      type.prototype[name] = function (...args) {
        const method = ancestorType.prototype[name];
        return method.apply(this.getAncestor(ancestorType), args);
      };
    });
}

const getConfig = configurator => configurator.getConfig();

export function mapToConfig(configurators) {
  return Array.isArray(configurators) ?
    configurators.map(getConfig) :
    mapValues(configurators, getConfig);
}

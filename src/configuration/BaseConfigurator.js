import mapValues from '../utils/mapValues';

export default class BaseConfigurator {
  constructor(parent) {
    this.parent = parent;
  }

  getAncestor(type) {
    if (this.parent) {
      return this.parent instanceof type ?
        this.parent :
        this.parent.getAncestor(type);
    }
    return null;
  }

  buildConfig() {
    const mapper = (value, deep = false) => {
      if (value instanceof BaseConfigurator) {
        return value.buildConfig();
      }
      if (deep && value instanceof Map) {
        return mapValues(value, mapper);
      }
      if (deep && Array.isArray(value)) {
        return value.map(mapper);
      }
      return value;
    };
    return mapValues(this.config, value => mapper(value, true), [
      'action',
      'initialState',
      'targetState',
    ]);
  }
}

'use strict';

export default class BaseConfigurator {
  constructor(factory, parent, config) {
    this.factory = factory;
    this.parent = parent;
    this.config = config || this.constructor.createConfig();
  }

  getAncestor(type) {
    if (this.parent) {
      return this.parent instanceof type ? this.parent : this.parent.getAncestor(type);
    }
    return null;
  }
}

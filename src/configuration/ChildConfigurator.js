'use strict';

export default class ChildConfigurator {
  constructor(parent) {
    this.parent = parent;
    this.configuratorFactory = parent.configuratorFactory;
  }

  getAncestor(type) {
    return this.parent instanceof type ?
      this.parent :
      this.parent.getAncestor && this.parent.getAncestor(type);
  }
}

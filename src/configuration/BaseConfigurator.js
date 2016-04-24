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
}

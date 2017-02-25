import BaseConfigurator from './BaseConfigurator';

export default class TransitionConfigurator extends BaseConfigurator {
  constructor(parent, targetState, options = {}) {
    super(parent);
    this.config = {
      targetState,
      ...options,
      actions: [],
      condition: null,
    };
  }

  withAction(action) {
    this.config.actions.push(action);
    return this;
  }

  withCondition(condition) {
    this.config.condition = condition;
    return this;
  }
}

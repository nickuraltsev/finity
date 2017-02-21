import BaseConfigurator from './BaseConfigurator';

export default class TransitionConfigurator extends BaseConfigurator {
  constructor(parent, targetState, isInternal) {
    super(parent);
    this.config = {
      targetState,
      isInternal: targetState === null && isInternal,
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

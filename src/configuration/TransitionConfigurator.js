import delegateToAncestor from './delegateToAncestor';
import StateConfigurator from './StateConfigurator';
import TriggerConfigurator from './TriggerConfigurator';
import BaseConfigurator from './BaseConfigurator';

class TransitionConfigurator extends BaseConfigurator {
  constructor(factory, parent, targetState, isInternal) {
    super(factory, parent, TransitionConfigurator.createConfig(targetState, isInternal));
  }

  withAction(action) {
    this.config.actions.push(action);
    return this;
  }

  withCondition(condition) {
    this.config.condition = condition;
    return this;
  }

  static createConfig(targetState, isInternal) {
    const config = Object.create(null);
    config.targetState = targetState;
    config.isInternal = targetState === null && isInternal;
    config.actions = [];
    return config;
  }
}

delegateToAncestor(TransitionConfigurator, StateConfigurator);
delegateToAncestor(TransitionConfigurator, TriggerConfigurator);

export default TransitionConfigurator;

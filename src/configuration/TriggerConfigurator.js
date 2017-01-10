import BaseConfigurator from './BaseConfigurator';
import TransitionConfigurator from './TransitionConfigurator';

export default class TriggerConfigurator extends BaseConfigurator {
  constructor(parent) {
    super(parent);
    this.config = {
      transitions: [],
    };
  }

  transitionTo(targetState) {
    return this.transition(targetState);
  }

  selfTransition() {
    return this.transition(null);
  }

  internalTransition() {
    return this.transition(null, true);
  }

  transition(targetState, isInternal) {
    const transitionConfigurator = new TransitionConfigurator(this, targetState, isInternal);
    this.config.transitions.push(transitionConfigurator);
    return transitionConfigurator;
  }
}

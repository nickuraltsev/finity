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
    return this.transition(null, { isInternal: true });
  }

  ignore() {
    return this.transition(null, { ignore: true });
  }

  transition(targetState, options) {
    const transitionConfigurator = new TransitionConfigurator(this, targetState, options);
    this.config.transitions.push(transitionConfigurator);
    return transitionConfigurator;
  }
}

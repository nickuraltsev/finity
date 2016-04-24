import BaseConfigurator from './BaseConfigurator';
import TransitionConfigurator from './TransitionConfigurator';
import { mapToConfig } from './ConfiguratorHelper';

export default class TriggerConfigurator extends BaseConfigurator {
  constructor(parent) {
    super(parent);
    this.transitionConfigurators = [];
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
    this.transitionConfigurators.push(transitionConfigurator);
    return transitionConfigurator;
  }

  getConfig() {
    return {
      transitions: mapToConfig(this.transitionConfigurators),
    };
  }
}

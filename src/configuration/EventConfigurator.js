import BaseConfigurator from './BaseConfigurator';

export default class EventConfigurator extends BaseConfigurator {
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
    const transitionConfigurator = this.factory.createTransitionConfigurator(
      this, targetState, isInternal
    );
    this.config.transitions.push(transitionConfigurator.config);
    return transitionConfigurator;
  }

  static createConfig() {
    const config = Object.create(null);
    config.transitions = [];
    return config;
  }
}

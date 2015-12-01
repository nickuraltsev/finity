'use strict';

import BaseConfigurator from './BaseConfigurator';

export default class EventConfigurator extends BaseConfigurator {
  transition(targetState, isInternal) {
    const transitionConfigurator = this.factory.createTransitionConfigurator(
      this, targetState, isInternal
    );
    this.config.transitions.push(transitionConfigurator.config);
    return transitionConfigurator;
  }

  selfTransition() {
    return this.transition(null, false);
  }

  internalTransition() {
    return this.transition(null, true);
  }

  static createConfig() {
    const config = Object.create(null);
    config.transitions = [];
    return config;
  }
}

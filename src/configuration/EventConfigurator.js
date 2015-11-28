'use strict';

import ChildConfigurator from './ChildConfigurator';

export default class EventConfigurator extends ChildConfigurator {
  constructor(parent, config) {
    super(parent);
    this.config = config || EventConfigurator.createConfig();
  }

  transition(targetState, isInternal) {
    const transitionConfigurator = this.configuratorFactory.createTransitionConfigurator(
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

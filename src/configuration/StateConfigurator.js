'use strict';

import delegateToAncestor from './delegateToAncestor';
import StateMachineConfigurator from './StateMachineConfigurator';
import ChildConfigurator from './ChildConfigurator';

@delegateToAncestor(StateMachineConfigurator)
export default class StateConfigurator extends ChildConfigurator {
  constructor(parent, config) {
    super(parent);
    this.config = config || StateConfigurator.createConfig();
  }

  onEnter(action) {
    this.config.entryActions.push(action);
    return this;
  }

  onExit(action) {
    this.config.exitActions.push(action);
    return this;
  }

  on(event) {
    const eventConfigurator = this.configuratorFactory.createEventConfigurator(
      this, this.config.events[event]
    );
    this.config.events[event] = eventConfigurator.config;
    return eventConfigurator;
  }

  static createConfig() {
    const config = Object.create(null);
    config.entryActions = [];
    config.exitActions = [];
    config.events = Object.create(null);
    return config;
  }
}

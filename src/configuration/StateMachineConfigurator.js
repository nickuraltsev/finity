'use strict';

import StateMachine from '../StateMachine';

export default class StateMachineConfigurator {
  constructor(configuratorFactory, config) {
    this.configuratorFactory = configuratorFactory;
    this.config = config || StateMachineConfigurator.createConfig();
  }

  onStateEnter(handler) {
    this.config.stateEnterHandlers.push(handler);
    return this;
  }

  onStateExit(handler) {
    this.config.stateExitHandlers.push(handler);
    return this;
  }

  onTransition(handler) {
    this.config.transitionHandlers.push(handler);
    return this;
  }

  onUnhandledEvent(handler) {
    this.config.unhandledEventHandlers.push(handler);
    return this;
  }

  initialState(state) {
    this.config.initialState = state;
    return this.state(state);
  }

  state(state) {
    const stateConfigurator = this.configuratorFactory.createStateConfigurator(
      this, this.config.states[state]
    );
    this.config.states[state] = stateConfigurator.config;
    return stateConfigurator;
  }

  getConfiguration() {
    return this.config;
  }

  start() {
    return StateMachine.start(this.config);
  }

  static createConfig() {
    const config = Object.create(null);
    config.states = Object.create(null);
    config.stateEnterHandlers = [];
    config.stateExitHandlers = [];
    config.transitionHandlers = [];
    config.unhandledEventHandlers = [];
    return config;
  }
}

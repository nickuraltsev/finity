'use strict';

import BaseConfigurator from './BaseConfigurator';
import StateMachine from '../StateMachine';

export default class StateMachineConfigurator extends BaseConfigurator {
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
    const stateConfigurator = this.factory.createStateConfigurator(this, this.config.states[state]);
    this.config.states[state] = stateConfigurator.config;
    return stateConfigurator;
  }

  getConfig() {
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

'use strict';

import BaseConfigurator from './BaseConfigurator';
import StateMachine from '../StateMachine';

export default class StateMachineConfigurator extends BaseConfigurator {
  global() {
    return this.factory.createGlobalConfigurator(this, this.config);
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

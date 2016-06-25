import BaseConfigurator from './BaseConfigurator';
import TriggerConfigurator from './TriggerConfigurator';
import TimerConfigurator from './TimerConfigurator';
import AsyncActionConfigurator from './AsyncActionConfigurator';
import { mapToConfig } from './ConfiguratorHelper';
import deepCopy from '../utils/deepCopy';

export default class StateConfigurator extends BaseConfigurator {
  constructor(parent) {
    super(parent);
    this.config = {
      entryActions: [],
      exitActions: [],
      submachine: null,
    };
    this.eventConfigurators = Object.create(null);
    this.timerConfigurators = [];
    this.asyncActionConfigurators = [];
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
    if (!this.eventConfigurators[event]) {
      this.eventConfigurators[event] = new TriggerConfigurator(this);
    }
    return this.eventConfigurators[event];
  }

  onTimeout(timeout) {
    const timerConfigurator = new TimerConfigurator(this, timeout);
    this.timerConfigurators.push(timerConfigurator);
    return timerConfigurator;
  }

  do(asyncAction) {
    const asyncActionConfigurator = new AsyncActionConfigurator(this, asyncAction);
    this.asyncActionConfigurators.push(asyncActionConfigurator);
    return asyncActionConfigurator;
  }

  submachine(submachineConfig) {
    this.config.submachine = submachineConfig;
    return this;
  }

  getConfig() {
    const config = deepCopy(this.config);
    config.events = mapToConfig(this.eventConfigurators);
    config.timers = mapToConfig(this.timerConfigurators);
    config.asyncActions = mapToConfig(this.asyncActionConfigurators);
    return config;
  }
}

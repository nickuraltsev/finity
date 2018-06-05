import BaseConfigurator from './BaseConfigurator';
import TriggerConfigurator from './TriggerConfigurator';
import TimerConfigurator from './TimerConfigurator';
import AsyncActionConfigurator from './AsyncActionConfigurator';

export default class StateConfigurator extends BaseConfigurator {
  constructor(parent) {
    super(parent);
    this.config = {
      entryActions: [],
      exitActions: [],
      events: new Map(),
      anyEventTrigger: null,
      timers: [],
      asyncActions: [],
      submachine: null,
    };
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
    if (!this.config.events.has(event)) {
      this.config.events.set(event, new TriggerConfigurator(this));
    }
    return this.config.events.get(event);
  }

  onAny() {
    if (!this.config.anyEventTrigger) {
      this.config.anyEventTrigger = new TriggerConfigurator(this);
    }
    return this.config.anyEventTrigger;
  }

  onTimeout(timeout) {
    const timerConfigurator = new TimerConfigurator(this, timeout);
    this.config.timers.push(timerConfigurator);
    return timerConfigurator;
  }

  do(asyncAction) {
    const asyncActionConfigurator = new AsyncActionConfigurator(this, asyncAction);
    this.config.asyncActions.push(asyncActionConfigurator);
    return asyncActionConfigurator;
  }

  submachine(submachineConfig) {
    this.config.submachine = submachineConfig;
    return this;
  }
}

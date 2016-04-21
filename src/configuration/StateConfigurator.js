import delegateToAncestor from './delegateToAncestor';
import StateMachineConfigurator from './StateMachineConfigurator';
import BaseConfigurator from './BaseConfigurator';

class StateConfigurator extends BaseConfigurator {
  onEnter(action) {
    this.config.entryActions.push(action);
    return this;
  }

  onExit(action) {
    this.config.exitActions.push(action);
    return this;
  }

  on(event) {
    const triggerConfigurator = this.factory.createTriggerConfigurator(
      this,
      this.config.events[event],
    );
    this.config.events[event] = triggerConfigurator.config;
    return triggerConfigurator;
  }

  onTimeout(timeout) {
    const timerConfigurator = this.factory.createTimerConfigurator(this, timeout);
    this.config.timers.push(timerConfigurator.config);
    return timerConfigurator;
  }

  static createConfig() {
    const config = Object.create(null);
    config.entryActions = [];
    config.exitActions = [];
    config.events = Object.create(null);
    config.timers = [];
    return config;
  }
}

delegateToAncestor(StateConfigurator, StateMachineConfigurator);

export default StateConfigurator;

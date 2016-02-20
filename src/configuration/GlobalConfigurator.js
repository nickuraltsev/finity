import delegateToAncestor from './delegateToAncestor';
import StateMachineConfigurator from './StateMachineConfigurator';
import BaseConfigurator from './BaseConfigurator';

class GlobalConfigurator extends BaseConfigurator {
  onStateEnter(hook) {
    this.config.stateEnterHooks.push(hook);
    return this;
  }

  onStateExit(hook) {
    this.config.stateExitHooks.push(hook);
    return this;
  }

  onStateChange(hook) {
    this.config.stateChangeHooks.push(hook);
    return this;
  }

  onTransition(hook) {
    this.config.transitionHooks.push(hook);
    return this;
  }

  onUnhandledEvent(hook) {
    this.config.unhandledEventHooks.push(hook);
    return this;
  }
}

delegateToAncestor(GlobalConfigurator, StateMachineConfigurator);

export default GlobalConfigurator;

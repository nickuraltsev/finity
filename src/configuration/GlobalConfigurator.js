import BaseConfigurator from './BaseConfigurator';
import deepCopy from '../utils/deepCopy';

export default class GlobalConfigurator extends BaseConfigurator {
  constructor(parent) {
    super(parent);
    this.config = {
      stateEnterHooks: [],
      stateExitHooks: [],
      stateChangeHooks: [],
      transitionHooks: [],
      unhandledEventHooks: [],
    };
  }

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

  internalGetConfig() {
    return deepCopy(this.config);
  }
}

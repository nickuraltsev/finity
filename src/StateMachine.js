'use strict';

export default class StateMachine {
  constructor(config) {
    this.config = config;
    this.currentState = config.initialState;
    this.isHandlingEvent = false;
  }

  getCurrentState() {
    return this.currentState;
  }

  handle(event) {
    if (this.isHandlingEvent) {
      return;
    }

    this.isHandlingEvent = true;
    try {
      this.handleCore(event);
      return this;
    }
    finally {
      this.isHandlingEvent = false;
    }
  }

  handleCore(event) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return;
    }

    const eventConfig = stateConfig.events[event];
    if (!eventConfig) {
      return;
    }

    const transitionConfig = eventConfig.transitions.find(t => !t.condition || t.condition());
    if (!transitionConfig) {
      return;
    }

    const nextState = transitionConfig.targetState !== null
      ? transitionConfig.targetState
      : this.currentState

    if (!transitionConfig.isInternal) {
      if (this.config.stateExitHandler) {
        this.config.stateExitHandler(this.currentState);
      }
      if (stateConfig.exitAction) {
        stateConfig.exitAction(this.currentState)
      }
    }

    if (this.config.transitionHandler) {
      this.config.transitionHandler(this.currentState, nextState);
    }
    if (transitionConfig.action) {
      transitionConfig.action(this.currentState, nextState);
    }

    if (!transitionConfig.isInternal) {
      if (this.config.stateEnterHandler) {
        this.config.stateEnterHandler(nextState);
      }
      const nextStateConfig = this.config.states[nextState];
      if (nextStateConfig && nextStateConfig.entryAction) {
        nextStateConfig.entryAction(nextState);
      }
      this.currentState = nextState;
    }
  }
}

'use strict';

export default class StateMachine {
  constructor(config) {
    if (config === undefined || config === null) {
      throw new Error('Configuration must be specified.');
    }
    if (typeof config !== 'object') {
      throw new Error('Configuration must be an object.');
    }
    if (config.initialState === undefined) {
      throw new Error('Initial state must be specified.');
    }
    this.config = config;
    this.currentState = config.initialState;
    this.isHandlingEvent = false;
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event) {
    return !this.isHandlingEvent && !!this.getTransition(event);
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
    const transitionConfig = this.getTransition(event);
    if (!transitionConfig) {
      return null;
    }

    const nextState = transitionConfig.targetState !== null
      ? transitionConfig.targetState
      : this.currentState

    if (!transitionConfig.isInternal) {
      if (this.config.stateExitHandler) {
        this.config.stateExitHandler(this.currentState);
      }
      const stateConfig = this.config.states[this.currentState];
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

  getTransition(event) {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      const eventConfig = stateConfig.events[event];
      return eventConfig
        ? eventConfig.transitions.find(t => !t.condition || t.condition())
        : null;
    }
    return null;
  }
}

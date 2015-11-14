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
    this.eventQueue = [];
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event) {
    return !!this.getTransition(event);
  }

  handle(event) {
    if (this.isHandlingEvent) {
      this.eventQueue.push(event);
      return this;
    }

    this.isHandlingEvent = true;
    try {
      this.handleCore(event);
      while (this.eventQueue.length > 0) {
        this.handleCore(this.eventQueue.shift());
      }
      return this;
    }
    finally {
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      this.isHandlingEvent = false;
    }
  }

  handleCore(event) {
    const transitionConfig = this.getTransition(event);
    if (!transitionConfig) {
      if (this.config.unhandledEventHandler) {
        this.config.unhandledEventHandler(event, this.currentState);
        return;
      }
      throw new Error(`State '${this.currentState}' cannot handle event '${event}'.`);
    }

    if (!transitionConfig.isInternal) {
      if (this.config.stateExitHandler) {
        this.config.stateExitHandler(this.currentState);
      }
      const stateConfig = this.config.states[this.currentState];
      if (stateConfig.exitAction) {
        stateConfig.exitAction(this.currentState)
      }
    }

    const nextState = transitionConfig.targetState !== null
      ? transitionConfig.targetState
      : this.currentState

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

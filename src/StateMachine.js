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
      if (this.config.unhandledEventHandlers.length > 0) {
        execute(this.config.unhandledEventHandlers, event, this.currentState);
        return;
      }
      throw new Error(`State '${this.currentState}' cannot handle event '${event}'.`);
    }

    if (!transitionConfig.isInternal) {
      execute(this.config.stateExitHandlers, this.currentState);
      const stateConfig = this.config.states[this.currentState];
      execute(stateConfig.exitActions, this.currentState);
    }

    const nextState = transitionConfig.targetState !== null
      ? transitionConfig.targetState
      : this.currentState

    execute(this.config.transitionHandlers, this.currentState, nextState);
    execute(transitionConfig.actions, this.currentState, nextState);

    if (!transitionConfig.isInternal) {
      execute(this.config.stateEnterHandlers, nextState);
      const nextStateConfig = this.config.states[nextState];
      if (nextStateConfig) {
        execute(nextStateConfig.entryActions, nextState);
      }
      this.currentState = nextState;
    }
  }

  getTransition(event) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return null;
    }
    const eventConfig = stateConfig.events[event];
    return eventConfig
      ? eventConfig.transitions.find(t => !t.condition || t.condition())
      : null;
  }
}

function execute(handlers, ...args) {
  handlers.forEach(handler => handler(...args));
}

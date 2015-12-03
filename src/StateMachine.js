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
    this.currentState = null;
    this.isHandlingEvent = false;
    this.eventQueue = [];
  }

  static start(config) {
    return new StateMachine(config).start();
  }

  start() {
    this.executeEntryHandlers(this.config.initialState);
    this.currentState = this.config.initialState;
    return this;
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
      this.executeExitHandlers(this.currentState);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState

    this.executeTransitionHandlers(this.currentState, nextState, transitionConfig);

    if (!transitionConfig.isInternal) {
      this.executeEntryHandlers(nextState);
      if (this.currentState !== nextState) {
        execute(this.config.stateChangeHandlers, this.currentState, nextState);
        this.currentState = nextState;
      }
    }
  }

  getTransition(event) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return null;
    }
    const eventConfig = stateConfig.events[event];
    return eventConfig ?
      eventConfig.transitions.find(t => !t.condition || t.condition()) :
      null;
  }

  executeEntryHandlers(state) {
    execute(this.config.stateEnterHandlers, state);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      execute(stateConfig.entryActions, state);
    }
  }

  executeExitHandlers(state) {
    execute(this.config.stateExitHandlers, state);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      execute(stateConfig.exitActions, state);
    }
  }

  executeTransitionHandlers(sourceState, targetState, transitionConfig) {
    execute(this.config.transitionHandlers, sourceState, targetState);
    execute(transitionConfig.actions, sourceState, targetState);
  }
}

function execute(handlers, ...args) {
  handlers.forEach(handler => handler(...args));
}

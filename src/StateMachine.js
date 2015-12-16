import executeHandlers from './utils/executeHandlers';

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
    this.isProcessing = false;
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
    this.eventQueue.push(event);
    if (this.isProcessing) {
      return this;
    }

    this.isProcessing = true;
    try {
      while (this.eventQueue.length > 0) {
        this.process(this.eventQueue.shift());
      }
    } finally {
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      this.isProcessing = false;
    }
    return this;
  }

  process(event) {
    const transitionConfig = this.getTransition(event);
    if (!transitionConfig) {
      this.onUnhandledEvent(this.currentState, event);
      return;
    }

    if (!transitionConfig.isInternal) {
      this.executeExitHandlers(this.currentState);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    this.executeTransitionHandlers(this.currentState, nextState, transitionConfig);

    if (!transitionConfig.isInternal) {
      this.executeEntryHandlers(nextState);
      if (this.currentState !== nextState) {
        executeHandlers(this.config.stateChangeHandlers, this.currentState, nextState);
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

  onUnhandledEvent(state, event) {
    if (this.config.unhandledEventHandlers.length > 0) {
      executeHandlers(this.config.unhandledEventHandlers, event, state);
    } else {
      throw new Error(`State '${state}' cannot handle event '${event}'.`);
    }
  }

  executeEntryHandlers(state) {
    executeHandlers(this.config.stateEnterHandlers, state);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      executeHandlers(stateConfig.entryActions, state);
    }
  }

  executeExitHandlers(state) {
    executeHandlers(this.config.stateExitHandlers, state);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      executeHandlers(stateConfig.exitActions, state);
    }
  }

  executeTransitionHandlers(sourceState, targetState, transitionConfig) {
    executeHandlers(this.config.transitionHandlers, sourceState, targetState);
    executeHandlers(transitionConfig.actions, sourceState, targetState);
  }
}

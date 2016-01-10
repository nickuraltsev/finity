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
    this.isProcessing = true;
    try {
      this.executeEntryHandlers(this.config.initialState, { stateMachine: this });
      this.currentState = this.config.initialState;
      this.processQueue();
    } finally {
      this.isProcessing = false;
    }
    return this;
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event, payload) {
    const context = this.createContext(event, payload);
    return !!this.getTransition(context);
  }

  handle(event, payload) {
    this.eventQueue.push({ event, payload });
    if (!this.isProcessing) {
      this.isProcessing = true;
      try {
        this.processQueue();
      } finally {
        this.isProcessing = false;
      }
    }
    return this;
  }

  processQueue() {
    try {
      while (this.eventQueue.length > 0) {
        const { event, payload } = this.eventQueue.shift();
        this.process(event, payload);
      }
    } catch (error) {
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      throw error;
    }
  }

  process(event, payload) {
    const context = this.createContext(event, payload);

    const transitionConfig = this.getTransition(context);
    if (!transitionConfig) {
      this.onUnhandledEvent(context);
      return;
    }

    if (!transitionConfig.isInternal) {
      this.executeExitHandlers(context);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    executeHandlers(this.config.transitionHandlers, this.currentState, nextState, context);
    executeHandlers(transitionConfig.actions, this.currentState, nextState, context);

    if (!transitionConfig.isInternal) {
      this.executeEntryHandlers(nextState, context);
      if (this.currentState !== nextState) {
        executeHandlers(this.config.stateChangeHandlers, this.currentState, nextState, context);
        this.currentState = nextState;
      }
    }
  }

  createContext(event, payload) {
    const context = { stateMachine: this, event };
    if (payload !== undefined) {
      context.payload = payload;
    }
    return context;
  }

  getTransition(context) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return null;
    }

    const eventConfig = stateConfig.events[context.event];
    return eventConfig ?
      eventConfig.transitions.find(t => !t.condition || t.condition(context)) :
      null;
  }

  onUnhandledEvent(context) {
    if (this.config.unhandledEventHandlers.length > 0) {
      executeHandlers(
        this.config.unhandledEventHandlers,
        context.event,
        this.currentState,
        context
      );
    } else {
      throw new Error(`State '${this.currentState}' cannot handle event '${context.event}'.`);
    }
  }

  executeEntryHandlers(state, context) {
    executeHandlers(this.config.stateEnterHandlers, state, context);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      executeHandlers(stateConfig.entryActions, state, context);
    }
  }

  executeExitHandlers(context) {
    executeHandlers(this.config.stateExitHandlers, this.currentState, context);
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      executeHandlers(stateConfig.exitActions, this.currentState, context);
    }
  }
}

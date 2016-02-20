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
      this.executeStateEnterHandlers(this.config.initialState, { stateMachine: this });
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

  canHandle(event, eventPayload) {
    const context = this.createContext(event, eventPayload);
    return !!this.getTransition(context);
  }

  handle(event, eventPayload) {
    this.eventQueue.push({ event, eventPayload });
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
        const { event, eventPayload } = this.eventQueue.shift();
        this.process(event, eventPayload);
      }
    } catch (error) {
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      throw error;
    }
  }

  process(event, eventPayload) {
    const context = this.createContext(event, eventPayload);

    const transitionConfig = this.getTransition(context);
    if (!transitionConfig) {
      this.onUnhandledEvent(context);
      return;
    }

    if (!transitionConfig.isInternal) {
      this.executeStateExitHandlers(context);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    executeHandlers(this.config.transitionHooks, this.currentState, nextState, context);
    executeHandlers(transitionConfig.actions, this.currentState, nextState, context);

    if (!transitionConfig.isInternal) {
      this.executeStateEnterHandlers(nextState, context);
      if (this.currentState !== nextState) {
        executeHandlers(this.config.stateChangeHooks, this.currentState, nextState, context);
        this.currentState = nextState;
      }
    }
  }

  createContext(event, eventPayload) {
    const context = { stateMachine: this, event };
    if (eventPayload !== undefined) {
      context.eventPayload = eventPayload;
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
    if (this.config.unhandledEventHooks.length > 0) {
      executeHandlers(
        this.config.unhandledEventHooks,
        context.event,
        this.currentState,
        context
      );
    } else {
      throw new Error(`Unhandled event '${context.event}' in state '${this.currentState}'.`);
    }
  }

  executeStateEnterHandlers(state, context) {
    executeHandlers(this.config.stateEnterHooks, state, context);
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      executeHandlers(stateConfig.entryActions, state, context);
    }
  }

  executeStateExitHandlers(context) {
    executeHandlers(this.config.stateExitHooks, this.currentState, context);
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      executeHandlers(stateConfig.exitActions, this.currentState, context);
    }
  }
}

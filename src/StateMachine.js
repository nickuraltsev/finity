import executeHandlers from './utils/executeHandlers';

export default class StateMachine {
  constructor(config) {
    if (config === undefined || config === null) {
      throw new Error('Configuration must be specified.');
    }
    if (typeof config !== 'object') {
      throw new Error('Configuration must be an object.');
    }
    if (config.initialState === undefined || config.initialState === null) {
      throw new Error('Initial state must be specified.');
    }
    this.config = config;
    this.currentState = null;
    this.isBusy = false;
    this.eventQueue = [];
    this.timerIDs = null;
    this.handleTimeout = ::this.handleTimeout;
  }

  static start(config) {
    return new StateMachine(config).start();
  }

  start() {
    if (!this.isStarted()) {
      this.execute(() => this.enterState(this.config.initialState, this.createContext()));
    }
    return this;
  }

  isStarted() {
    return this.currentState !== null;
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event, eventPayload) {
    if (!this.isStarted()) {
      return false;
    }
    const context = this.createContext(event, eventPayload);
    return !!this.getTransitionForEvent(context);
  }

  handle(event, eventPayload) {
    if (!this.isBusy) {
      this.execute(() => this.processEvent(event, eventPayload));
    } else {
      this.eventQueue.push({ event, eventPayload });
    }
    return this;
  }

  execute(operation) {
    if (this.isBusy) {
      throw new Error('Operation cannot be executed because another operation is in progress.');
    }
    this.isBusy = true;
    try {
      operation();

      // Process all events
      while (this.eventQueue.length > 0) {
        const { event, eventPayload } = this.eventQueue.shift();
        this.processEvent(event, eventPayload);
      }
    } finally {
      // Clean up
      if (this.eventQueue.length > 0) {
        this.eventQueue = [];
      }
      this.isBusy = false;
    }
  }

  processEvent(event, eventPayload) {
    const context = this.createContext(event, eventPayload);
    const transitionConfig = this.getTransitionForEvent(context);
    if (transitionConfig) {
      this.executeTransition(transitionConfig, context);
    } else {
      this.handleUnhandledEvent(context);
    }
  }

  createContext(event, eventPayload) {
    const context = { stateMachine: this };
    if (event !== undefined) {
      context.event = event;
    }
    if (eventPayload !== undefined) {
      context.eventPayload = eventPayload;
    }
    return context;
  }

  getTransitionForEvent(context) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return null;
    }

    const eventConfig = stateConfig.events[context.event];
    return eventConfig ? this.selectTransition(eventConfig.transitions, context) : null;
  }

  executeTransition(transitionConfig, context) {
    if (!transitionConfig.isInternal) {
      this.exitState(context);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    executeHandlers(this.config.transitionHooks, this.currentState, nextState, context);
    executeHandlers(transitionConfig.actions, this.currentState, nextState, context);

    if (!transitionConfig.isInternal) {
      this.enterState(nextState, context);
    }
  }

  handleUnhandledEvent(context) {
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

  enterState(state, context) {
    executeHandlers(this.config.stateEnterHooks, state, context);

    const stateConfig = this.config.states[state];
    if (stateConfig) {
      executeHandlers(stateConfig.entryActions, state, context);
    }

    if (this.currentState !== null && this.currentState !== state) {
      executeHandlers(this.config.stateChangeHooks, this.currentState, state, context);
    }

    this.currentState = state;

    this.startTimers();
  }

  exitState(context) {
    this.stopTimers();

    executeHandlers(this.config.stateExitHooks, this.currentState, context);

    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      executeHandlers(stateConfig.exitActions, this.currentState, context);
    }
  }

  startTimers() {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig && stateConfig.timers.length > 0) {
      this.timerIDs = stateConfig.timers.map(timerConfig => setTimeout(
        this.handleTimeout,
        timerConfig.timeout,
        timerConfig,
      ));
    }
  }

  stopTimers() {
    if (this.timerIDs) {
      this.timerIDs.forEach(clearTimeout);
      this.timerIDs = null;
    }
  }

  handleTimeout(timerConfig) {
    this.execute(() => {
      const context = this.createContext();
      const transitionConfig = this.selectTransition(timerConfig.transitions, context);
      if (transitionConfig) {
        this.executeTransition(transitionConfig, context);
      }
    });
  }

  selectTransition(transitions, context) {
    return transitions.find(t => !t.condition || t.condition(context));
  }
}

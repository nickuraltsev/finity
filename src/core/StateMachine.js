import Dispatcher from './Dispatcher';
import AsyncActionSubscription from './AsyncActionSubscription';
import executeHandlers from '../utils/executeHandlers';

export default class StateMachine {
  constructor(config, parent) {
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
    this.parent = parent;
    this.currentState = null;
    this.dispatcher = parent ? parent.dispatcher : new Dispatcher(::this.internalHandle);
    this.submachines = Object.create(null);
    this.timerIDs = null;
    this.asyncActionSubscriptions = null;
    this.handleTimeout = ::this.handleTimeout;
  }

  static start(config) {
    const stateMachine = new StateMachine(config);
    stateMachine.dispatcher.execute(() => stateMachine.start());
    return stateMachine;
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event, eventPayload) {
    if (!this.isStarted()) {
      return false;
    }

    const submachine = this.submachines[this.currentState];
    if (submachine && submachine.canHandle(event, eventPayload)) {
      return true;
    }

    const context = this.createContext(event, eventPayload);
    return !!this.getTransitionForEvent(context);
  }

  handle(event, eventPayload) {
    this.dispatcher.dispatch(event, eventPayload);
    return this;
  }

  isStarted() {
    return this.currentState !== null;
  }

  start() {
    if (!this.isStarted()) {
      this.enterState(this.config.initialState, this.createContext());
    }
  }

  stop() {
    if (this.isStarted()) {
      this.exitState(this.createContext());
      this.currentState = null;
    }
  }

  internalHandle(event, eventPayload) {
    const submachine = this.submachines[this.currentState];
    if (submachine && submachine.internalHandle(event, eventPayload)) {
      return true;
    }

    const context = this.createContext(event, eventPayload);
    const transitionConfig = this.getTransitionForEvent(context);
    if (transitionConfig) {
      this.executeTransition(transitionConfig, context);
      return true;
    }

    if (!this.parent) {
      this.handleUnhandledEvent(context);
    }

    return false;
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

    this.startAsyncActions(context);
    this.startTimers();
    this.startSubmachines();
  }

  exitState(context) {
    this.stopSubmachines();
    this.stopTimers();
    this.cancelAsyncActionSubscriptions();

    executeHandlers(this.config.stateExitHooks, this.currentState, context);

    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      executeHandlers(stateConfig.exitActions, this.currentState, context);
    }
  }

  startAsyncActions(context) {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      stateConfig.asyncActions.forEach(
        asyncActionConfig => this.startAsyncAction(asyncActionConfig, context)
      );
    }
  }

  startAsyncAction(asyncActionConfig, context) {
    const action = asyncActionConfig.action;

    const subscription = new AsyncActionSubscription(
      result => this.handleAsyncActionSuccess(asyncActionConfig.onSuccess, result),
      error => this.handleAsyncActionFailure(asyncActionConfig.onFailure, error)
    );

    action(this.currentState, context).then(
      subscription.onSuccess,
      subscription.onFailure
    );

    this.asyncActionSubscriptions = this.asyncActionSubscriptions || [];
    this.asyncActionSubscriptions.push(subscription);
  }

  cancelAsyncActionSubscriptions() {
    if (this.asyncActionSubscriptions) {
      this.asyncActionSubscriptions.forEach(subscription => subscription.cancel());
      this.asyncActionSubscriptions = null;
    }
  }

  handleAsyncActionSuccess(triggerConfig, result) {
    const context = this.createContext();
    context.result = result;
    this.executeTrigger(triggerConfig, context);
  }

  handleAsyncActionFailure(triggerConfig, error) {
    const context = this.createContext();
    context.error = error;
    this.executeTrigger(triggerConfig, context);
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
    this.executeTrigger(timerConfig, this.createContext());
  }

  startSubmachines() {
    const stateConfig = this.config.states[this.currentState];
    if (stateConfig && stateConfig.submachine) {
      if (!this.submachines[this.currentState]) {
        this.submachines[this.currentState] = new StateMachine(stateConfig.submachine, this);
      }
      this.submachines[this.currentState].start();
    }
  }

  stopSubmachines() {
    const submachine = this.submachines[this.currentState];
    if (submachine) {
      submachine.stop();
    }
  }

  executeTrigger(triggerConfig, context) {
    this.dispatcher.execute(() => {
      const transitionConfig = this.selectTransition(triggerConfig.transitions, context);
      if (transitionConfig) {
        this.executeTransition(transitionConfig, context);
      }
    });
  }

  selectTransition(transitions, context) {
    for (let i = 0; i < transitions.length; i++) {
      if (!transitions[i].condition || transitions[i].condition(context)) {
        return transitions[i];
      }
    }
    return null;
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
}

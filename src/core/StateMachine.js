import invokeEach from '../utils/invokeEach';
import merge from '../utils/merge';

const noop = () => {};

export default class StateMachine {
  constructor(config, taskScheduler, contextFactory) {
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
    this.taskScheduler = taskScheduler;
    this.contextFactory = contextFactory;
    this.currentState = null;
    this.submachines = Object.create(null);
    this.timerIDs = null;
    this.asyncActionCancelers = null;
    this.handleAsyncActionComplete = ::this.handleAsyncActionComplete;
    this.handleTimeout = ::this.handleTimeout;
  }

  getCurrentState() {
    return this.currentState;
  }

  canHandle(event, eventPayload) {
    if (!this.isStarted()) {
      return false;
    }

    const context = this.createContextWithEvent(event, eventPayload);
    return !!this.getFirstAllowedTransitionForEvent(context);
  }

  tryHandle(event, eventPayload) {
    if (!this.isStarted()) {
      return false;
    }

    const context = this.createContextWithEvent(event, eventPayload);
    const transitionConfig = this.getFirstAllowedTransitionForEvent(context);
    if (transitionConfig) {
      this.executeTransition(transitionConfig, context);
      return true;
    }
    return false;
  }

  handleUnhandledEvent(event, eventPayload) {
    if (this.config.global.unhandledEventHooks.length > 0) {
      invokeEach(
        this.config.global.unhandledEventHooks,
        event,
        this.currentState,
        this.createContextWithEvent(event, eventPayload)
      );
    } else {
      throw new Error(`Unhandled event '${event}' in state '${this.currentState}'.`);
    }
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

  getSubmachine() {
    return this.isStarted() ? this.submachines[this.currentState] : null;
  }

  executeTransition(transitionConfig, context) {
    if (transitionConfig.ignore) {
      return;
    }

    if (!transitionConfig.isInternal) {
      this.exitState(context);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    invokeEach(this.config.global.transitionHooks, this.currentState, nextState, context);
    invokeEach(transitionConfig.actions, this.currentState, nextState, context);

    if (!transitionConfig.isInternal) {
      this.enterState(nextState, context);
    }
  }

  enterState(state, context) {
    invokeEach(this.config.global.stateEnterHooks, state, context);

    const stateConfig = this.config.states[state];
    if (stateConfig) {
      invokeEach(stateConfig.entryActions, state, context);
    }

    if (this.currentState !== null && this.currentState !== state) {
      invokeEach(this.config.global.stateChangeHooks, this.currentState, state, context);
    }

    try {
      this.startAsyncActions(state, context);
      this.startTimers(state);
      this.startSubmachines(state);
    } catch (error) {
      this.stopTimers();
      this.cancelAsyncActions();
      throw error;
    }

    this.currentState = state;
  }

  exitState(context) {
    this.stopSubmachines();
    this.stopTimers();
    this.cancelAsyncActions();

    invokeEach(this.config.global.stateExitHooks, this.currentState, context);

    const stateConfig = this.config.states[this.currentState];
    if (stateConfig) {
      invokeEach(stateConfig.exitActions, this.currentState, context);
    }
  }

  startAsyncActions(state, context) {
    const stateConfig = this.config.states[state];
    if (stateConfig) {
      stateConfig.asyncActions.forEach(
        asyncActionConfig => this.startAsyncAction(asyncActionConfig, state, context)
      );
    }
  }

  startAsyncAction(asyncActionConfig, state, context) {
    const { action, successTrigger, failureTrigger } = asyncActionConfig;
    let handleComplete = this.handleAsyncActionComplete;
    action(state, context).then(
      result => handleComplete(successTrigger, { result }),
      error => handleComplete(failureTrigger, { error })
    );
    this.asyncActionCancelers = this.asyncActionCancelers || [];
    this.asyncActionCancelers.push(() => {
      handleComplete = noop;
    });
  }

  cancelAsyncActions() {
    if (this.asyncActionCancelers) {
      invokeEach(this.asyncActionCancelers);
      this.asyncActionCancelers = null;
    }
  }

  handleAsyncActionComplete(triggerConfig, additionalContext) {
    const context = merge(this.createContext(), additionalContext);
    this.executeTrigger(triggerConfig, context);
  }

  startTimers(state) {
    const stateConfig = this.config.states[state];
    if (stateConfig && stateConfig.timers.length > 0) {
      this.timerIDs = stateConfig.timers.map(timerConfig => setTimeout(
        this.handleTimeout,
        timerConfig.timeout,
        timerConfig
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

  startSubmachines(state) {
    const stateConfig = this.config.states[state];
    if (stateConfig && stateConfig.submachine) {
      if (!this.submachines[state]) {
        this.submachines[state] = new StateMachine(
          stateConfig.submachine, this.taskScheduler, this.contextFactory
        );
      }
      this.submachines[state].start();
    }
  }

  stopSubmachines() {
    const submachine = this.submachines[this.currentState];
    if (submachine) {
      submachine.stop();
    }
  }

  createContext() {
    return this.contextFactory(this);
  }

  createContextWithEvent(event, eventPayload) {
    const context = this.createContext();
    context.event = event;
    if (eventPayload !== undefined) {
      context.eventPayload = eventPayload;
    }
    return context;
  }

  static getFirstAllowedTransition(transitions, context) {
    for (let i = 0; i < transitions.length; i++) {
      if (!transitions[i].condition || transitions[i].condition(context)) {
        return transitions[i];
      }
    }
    return null;
  }

  getFirstAllowedTransitionForEvent(context) {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig) {
      return null;
    }

    let transitionConfig = null;

    const eventConfig = stateConfig.events[context.event];
    if (eventConfig) {
      transitionConfig = StateMachine.getFirstAllowedTransition(eventConfig.transitions, context);
    }

    if (!transitionConfig && stateConfig.anyEventTrigger) {
      transitionConfig = StateMachine.getFirstAllowedTransition(
        stateConfig.anyEventTrigger.transitions, context
      );
    }

    return transitionConfig;
  }

  executeTrigger(triggerConfig, context) {
    this.taskScheduler.execute(() => {
      const transitionConfig = StateMachine.getFirstAllowedTransition(
        triggerConfig.transitions, context
      );
      if (transitionConfig) {
        this.executeTransition(transitionConfig, context);
      }
    });
  }
}

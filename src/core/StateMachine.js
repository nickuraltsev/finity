import invokeEach from '../utils/invokeEach';

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
    this.submachines = new Map();
    this.timerIDs = null;
    this.asyncActionCancelers = null;
    this.handleAsyncActionComplete = this.handleAsyncActionComplete.bind(this);
    this.handleTimeout = this.handleTimeout.bind(this);
  }

  getCurrentState() {
    return this.currentState;
  }

  async canHandle(event, eventPayload) {
    if (!this.isStarted()) {
      return false;
    }

    const context = this.createContextWithEvent(event, eventPayload);
    return !!(await this.getFirstAllowedTransitionForEvent(context));
  }

  async handle(event, eventPayload) {
    if (!this.isStarted()) {
      throw new Error('Cannot handle events before starting the state machine!');
    }
    const context = this.createContextWithEvent(event, eventPayload);
    const transitionConfig = await this.getFirstAllowedTransitionForEvent(context);
    if (transitionConfig) {
      return await this.executeTransition(transitionConfig, context);
    }
    return await this.handleUnhandledEvent(event, eventPayload);
  }

  async handleUnhandledEvent(event, eventPayload) {
    if (this.config.global.unhandledEventHooks.length > 0) {
      return (await invokeEach(
        this.config.global.unhandledEventHooks,
        event,
        this.currentState,
        this.createContextWithEvent(event, eventPayload)
      ))[0];
    }
    throw new Error(`Unhandled event '${event}' in state '${this.currentState}'.`);
  }

  isStarted() {
    return this.currentState !== null;
  }

  async start() {
    if (!this.isStarted()) {
      await this.enterState(this.config.initialState, this.createContext());
    }
  }

  async stop() {
    if (this.isStarted()) {
      await this.exitState(this.createContext());
      this.currentState = null;
    }
  }

  getSubmachine() {
    return this.isStarted() ? this.submachines.get(this.currentState) : null;
  }

  async executeTransition(transitionConfig, context) {
    if (transitionConfig.ignore) {
      return undefined;
    }

    if (!transitionConfig.isInternal) {
      await this.exitState(context);
    }

    const nextState = transitionConfig.targetState !== null ?
      transitionConfig.targetState :
      this.currentState;

    await invokeEach(this.config.global.transitionHooks, this.currentState, nextState, context);
    const actionRetvals = await invokeEach(
      transitionConfig.actions,
      this.currentState,
      nextState,
      context
    );

    if (!transitionConfig.isInternal) {
      await this.enterState(nextState, context);
    }

    return (actionRetvals.length > 1 ? actionRetvals : actionRetvals[0]);
  }

  async enterState(state, context) {
    await invokeEach(this.config.global.stateEnterHooks, state, context);

    const stateConfig = this.config.states.get(state);
    if (stateConfig) {
      await invokeEach(stateConfig.entryActions, state, context);
    }

    if (this.currentState !== null && this.currentState !== state) {
      await invokeEach(this.config.global.stateChangeHooks, this.currentState, state, context);
    }

    try {
      this.startAsyncActions(state, context);
      this.startTimers(state);
      await this.startSubmachines(state);
    } catch (error) {
      this.stopTimers();
      this.cancelAsyncActions();
      throw error;
    }

    this.currentState = state;
  }

  async exitState(context) {
    await this.stopSubmachines();
    this.stopTimers();
    this.cancelAsyncActions();

    await invokeEach(this.config.global.stateExitHooks, this.currentState, context);

    const stateConfig = this.config.states.get(this.currentState);
    if (stateConfig) {
      await invokeEach(stateConfig.exitActions, this.currentState, context);
    }
  }

  startAsyncActions(state, context) {
    const stateConfig = this.config.states.get(state);
    if (stateConfig) {
      stateConfig.asyncActions.forEach(
        asyncActionConfig => this.startAsyncAction(asyncActionConfig, state, context)
      );
    }
  }

  startAsyncAction(asyncActionConfig, state, context) {
    this.taskScheduler.enqueue(() => {
      const { action, successTrigger, failureTrigger } = asyncActionConfig;
      let handleComplete = this.handleAsyncActionComplete;
      this.taskScheduler.enqueue(async () => {
        action(state, context).then(
          result => handleComplete(successTrigger, { result }),
          error => handleComplete(failureTrigger, { error })
        );
      }).then(null, x => { throw x; });
      this.asyncActionCancelers = this.asyncActionCancelers || [];
      this.asyncActionCancelers.push(() => {
        handleComplete = noop;
      });
    }).then(null, x => { throw x; });
  }

  cancelAsyncActions() {
    if (this.asyncActionCancelers) {
      this.asyncActionCancelers.forEach(x => x());
      this.asyncActionCancelers = null;
    }
  }

  async handleAsyncActionComplete(triggerConfig, additionalContext) {
    const context = Object.assign(this.createContext(), additionalContext);
    await this.executeTrigger(triggerConfig, context);
  }

  startTimers(state) {
    const stateConfig = this.config.states.get(state);
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
    this.executeTrigger(timerConfig, this.createContext()).then(null, x => { throw x; });
  }

  async startSubmachines(state) {
    const stateConfig = this.config.states.get(state);
    if (stateConfig && stateConfig.submachine) {
      if (!this.submachines.get(state)) {
        this.submachines.set(state, new StateMachine(
          stateConfig.submachine, this.taskScheduler, this.contextFactory
        ));
      }
      await this.submachines.get(state).start();
    }
  }

  async stopSubmachines() {
    const submachine = this.submachines.get(this.currentState);
    if (submachine) {
      await submachine.stop();
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

  static async getFirstAllowedTransition(transitions, context) {
    for (let i = 0; i < transitions.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      if (!transitions[i].condition || await transitions[i].condition(context)) {
        return transitions[i];
      }
    }
    return null;
  }

  async getFirstAllowedTransitionForEvent(context) {
    const stateConfig = this.config.states.get(this.currentState);
    if (!stateConfig) {
      return null;
    }

    let transitionConfig = null;

    const eventConfig = stateConfig.events.get(context.event);
    if (eventConfig) {
      transitionConfig = await StateMachine.getFirstAllowedTransition(
        eventConfig.transitions,
        context
      );
    }

    if (!transitionConfig && stateConfig.anyEventTrigger) {
      transitionConfig = await StateMachine.getFirstAllowedTransition(
        stateConfig.anyEventTrigger.transitions, context
      );
    }

    return transitionConfig;
  }

  async executeTrigger(triggerConfig, context) {
    return await this.taskScheduler.enqueue(async () => {
      const transitionConfig = await StateMachine.getFirstAllowedTransition(
        triggerConfig.transitions, context
      );
      if (transitionConfig) {
        return await this.executeTransition(transitionConfig, context);
      }
      return undefined;
    });
  }
}

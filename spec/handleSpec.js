import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('handle', () => {
  it('transitions to next state', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1').on('event1').transitionTo('state2')
      .start()
      .handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state2');
  });

  it('selects first transition for which condition is true', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
        .on('event1')
          .transitionTo('state2').withCondition(() => false)
          .transitionTo('state3').withCondition(() => true)
      .start()
      .handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');
  });

  it('throws if event cannot be handled', () => {
    expect(() =>
      StateMachine
        .configure()
        .initialState('state1')
        .start()
        .handle('event1')
    ).toThrowError('State \'state1\' cannot handle event \'event1\'.');
  });

  it('calls unhandledEvent handler', () => {
    const handler = jasmine.createSpy();

    const stateMachine = StateMachine
      .configure()
      .global().onUnhandledEvent(handler)
      .initialState('state1')
      .start()
      .handle('event1');

    const context = { stateMachine, event: 'event1' };
    expect(handler).toHaveBeenCalledWith('event1', 'state1', context);
  });

  it('calls handlers with correct parameters', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHandler)
        .onStateExit(mocks.stateExitHandler)
        .onStateChange(mocks.stateChangeHandler)
        .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
        .onExit(mocks.exitAction)
      .state('state2')
        .onEnter(mocks.entryAction)
      .start()
      .handle('event1', 'payload1');

    const startContext = { stateMachine };
    expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1', startContext);

    const eventContext = { stateMachine, event: 'event1', payload: 'payload1' };
    expect(mocks.stateExitHandler).toHaveBeenCalledWith('state1', eventContext);
    expect(mocks.exitAction).toHaveBeenCalledWith('state1', eventContext);
    expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state2', eventContext);
    expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state2', eventContext);
    expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state2', eventContext);
    expect(mocks.entryAction).toHaveBeenCalledWith('state2', eventContext);
    expect(mocks.stateChangeHandler).toHaveBeenCalledWith('state1', 'state2', eventContext);
  });

  it('calls handlers in correct order', () => {
    const calledHandlers = [];

    StateMachine
      .configure()
      .global()
        .onStateEnter(() => calledHandlers.push('stateEnter handler'))
        .onStateExit(() => calledHandlers.push('stateExit handler'))
        .onStateChange(() => calledHandlers.push('stateChange handler'))
        .onTransition(() => calledHandlers.push('transition handler'))
      .initialState('state1')
        .onEnter(() => calledHandlers.push('state1 entry action'))
        .on('event')
          .transitionTo('state2')
            .withAction(() => calledHandlers.push('state1->state2 transition action'))
        .onExit(() => calledHandlers.push('state1 exit action'))
      .state('state2')
        .onEnter(() => calledHandlers.push('state2 entry action'))
      .start()
      .handle('event');

    expect(calledHandlers).toEqual([
      'stateEnter handler',
      'state1 entry action',
      'stateExit handler',
      'state1 exit action',
      'transition handler',
      'state1->state2 transition action',
      'stateEnter handler',
      'state2 entry action',
      'stateChange handler',
    ]);
  });

  it('calls handlers for self-transition', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHandler)
        .onStateExit(mocks.stateExitHandler)
        .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event1').selfTransition().withAction(mocks.transitionAction)
      .start();

    mocks.reset();

    stateMachine.handle('event1');

    const context = { stateMachine, event: 'event1' };
    expect(mocks.stateExitHandler).toHaveBeenCalledWith('state1', context);
    expect(mocks.exitAction).toHaveBeenCalledWith('state1', context);
    expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state1', context);
    expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state1', context);
    expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1', context);
    expect(mocks.entryAction).toHaveBeenCalledWith('state1', context);
  });

  it('does not call stateChange handler for self-transition', () => {
    const stateChangeHandler = jasmine.createSpy();

    StateMachine
      .configure()
      .global().onStateChange(stateChangeHandler)
      .initialState('state1')
        .on('event1').selfTransition()
      .start()
      .handle('event1');

    expect(stateChangeHandler).not.toHaveBeenCalled();
  });

  it('calls only transition handlers for internal transition', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHandler)
        .onStateExit(mocks.stateExitHandler)
        .onStateChange(mocks.stateChangeHandler)
        .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event1').internalTransition().withAction(mocks.transitionAction)
      .start();

    mocks.reset();

    stateMachine.handle('event1');

    const context = { stateMachine, event: 'event1' };
    expect(mocks.stateExitHandler).not.toHaveBeenCalled();
    expect(mocks.exitAction).not.toHaveBeenCalled();
    expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state1', context);
    expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state1', context);
    expect(mocks.stateEnterHandler).not.toHaveBeenCalled();
    expect(mocks.entryAction).not.toHaveBeenCalled();
    expect(mocks.stateChangeHandler).not.toHaveBeenCalled();
  });

  it('handles event fired from action', () => {
    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2')
      .state('state2')
        .onEnter(() => stateMachine.handle('event2'))
        .on('event2').transitionTo('state3')
      .start();

    stateMachine.handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');
  });

  it('handles event fired from action after current transition is completed', () => {
    const executedActions = [];

    const stateMachine = StateMachine
      .configure()
      .initialState('state1')
        .on('event1')
          .transitionTo('state2')
            .withAction(() => executedActions.push('state1->state2 transition action'))
        .onExit(() => {
          stateMachine.handle('event2');
          executedActions.push('state1 exit action');
        })
      .state('state2')
        .onEnter(() => executedActions.push('state2 entry action'))
        .on('event2')
          .transitionTo('state3')
            .withAction(() => executedActions.push('state2->state3 transition action'))
        .onExit(() => executedActions.push('state2 exit action'))
      .state('state3')
        .onEnter(() => executedActions.push('state3 entry action'))
      .start();

    stateMachine.handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');

    expect(executedActions).toEqual([
      'state1 exit action',
      'state1->state2 transition action',
      'state2 entry action',
      'state2 exit action',
      'state2->state3 transition action',
      'state3 entry action',
    ]);
  });
});

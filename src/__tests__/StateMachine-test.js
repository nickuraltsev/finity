'use strict';

jest.autoMockOff();

const StateMachine = require('..');

describe('StateMachine', () => {
  it('can be created using build method', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('State')
      .build();

    expect(stateMachine.getCurrentState()).toBe('State');
  });

  it('can be created by passing configuration to its constructor', () => {
    const config = StateMachine
      .getBuilder()
      .initialState('State')
      .getConfiguration();

    const stateMachine = new StateMachine(config);
    expect(stateMachine.getCurrentState()).toBe('State');
  });

  it('throws if configuration is undefined', () => {
    expect(() => new StateMachine())
      .toThrow('Configuration must be specified.');
  });

  it('throws if configuration is null', () => {
    expect(() => new StateMachine())
      .toThrow('Configuration must be specified.');
  });

  it('throws if configuration is not an object', () => {
    expect(() => new StateMachine(100))
      .toThrow('Configuration must be an object.');
  });

  it('throws if initial state is undefined', () => {
    expect(() => StateMachine.getBuilder().build())
      .toThrow('Initial state must be specified.');
  });

  it('transitions to next state', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('State1').on('event').transition('State2')
      .build()
      .handle('event');

      expect(stateMachine.getCurrentState()).toBe('State2');
  });

  it('selects first transition for which condition is true', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('State1')
        .on('event')
          .transition('State2').withCondition(() => false)
          .transition('State3').withCondition(() => true)
      .build()
      .handle('event');

    expect(stateMachine.getCurrentState()).toBe('State3');
  });

  it('throws if event cannot be handled', () => {
    expect(() =>
      StateMachine
        .getBuilder()
        .initialState('State1')
        .build()
        .handle('event1')
    ).toThrow('State \'State1\' cannot handle event \'event1\'.')
  });

  it('calls unhandledEvent handler', () => {
    const handler = jest.genMockFn();

    StateMachine
      .getBuilder()
      .onUnhandledEvent(handler)
      .initialState('State1')
      .build()
      .handle('event1');

    expect(handler).toBeCalledWith('event1', 'State1');
  });

  it('calls handlers with correct parameters', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('State1')
        .on('event').transition('State2').withAction(mocks.transitionAction)
        .onExit(mocks.exitAction)
      .state('State2')
        .onEnter(mocks.entryAction)
      .build()
      .handle('event');

    expect(mocks.stateExitHandler).toBeCalledWith('State1');
    expect(mocks.exitAction).toBeCalledWith('State1');
    expect(mocks.transitionHandler).toBeCalledWith('State1', 'State2');
    expect(mocks.transitionAction).toBeCalledWith('State1', 'State2');
    expect(mocks.stateEnterHandler).toBeCalledWith('State2');
    expect(mocks.entryAction).toBeCalledWith('State2');
  });

  it('calls handlers in correct order', () => {
    const calledHandlers = [];

    StateMachine
      .getBuilder()
      .onStateEnter(() => calledHandlers.push('StateMachine: stateEnter'))
      .onStateExit(() => calledHandlers.push('StateMachine: stateExit'))
      .onTransition(() => calledHandlers.push('StateMachine: transition'))
      .initialState('State1')
        .on('event')
          .transition('State2')
          .withAction(() => calledHandlers.push('Transition action'))
        .onExit(() => calledHandlers.push('State1 exit action'))
      .state('State2')
        .onEnter(() => calledHandlers.push('State2 entry action'))
      .build()
      .handle('event');

    expect(calledHandlers).toEqual([
      'StateMachine: stateExit',
      'State1 exit action',
      'StateMachine: transition',
      'Transition action',
      'StateMachine: stateEnter',
      'State2 entry action'
    ]);
  });

  it('calls all handlers for self-transition', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('State')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event').selfTransition().withAction(mocks.transitionAction)
      .build()
      .handle('event');

    expect(mocks.stateExitHandler).toBeCalledWith('State');
    expect(mocks.exitAction).toBeCalledWith('State');
    expect(mocks.transitionHandler).toBeCalledWith('State', 'State');
    expect(mocks.transitionAction).toBeCalledWith('State', 'State');
    expect(mocks.stateEnterHandler).toBeCalledWith('State');
    expect(mocks.entryAction).toBeCalledWith('State');
  });

  it('calls only transition handlers for internal transition', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('State')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event').internalTransition().withAction(mocks.transitionAction)
      .build()
      .handle('event');

    expect(mocks.stateExitHandler).not.toBeCalled();
    expect(mocks.exitAction).not.toBeCalled();
    expect(mocks.transitionHandler).toBeCalledWith('State', 'State');
    expect(mocks.transitionAction).toBeCalledWith('State', 'State');
    expect(mocks.stateEnterHandler).not.toBeCalled();
    expect(mocks.entryAction).not.toBeCalled();
  });

  describe('canHandle', () => {
    it('returns true when event can be handled', () => {
      const stateMachine = StateMachine
        .getBuilder()
        .initialState('State1').on('event').transition('State2')
        .build();

        expect(stateMachine.canHandle('event')).toBe(true);
    });

    it('returns false when event cannot be handled', () => {
      const stateMachine = StateMachine
        .getBuilder()
        .initialState('State')
        .build();

        expect(stateMachine.canHandle('event')).toBe(false);
    });
  });
});

function getHandlerMocks() {
  return {
    stateEnterHandler: jest.genMockFn(),
    stateExitHandler: jest.genMockFn(),
    transitionHandler: jest.genMockFn(),
    entryAction: jest.genMockFn(),
    exitAction: jest.genMockFn(),
    transitionAction: jest.genMockFn()
  };
}

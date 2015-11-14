'use strict';

jest.autoMockOff();

const StateMachine = require('..');

describe('StateMachine', () => {
  it('can be created using build method', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('state1')
      .build();

    expect(stateMachine.getCurrentState()).toBe('state1');
  });

  it('can be created by passing configuration to its constructor', () => {
    const config = StateMachine
      .getBuilder()
      .initialState('state1')
      .getConfiguration();

    const stateMachine = new StateMachine(config);
    expect(stateMachine.getCurrentState()).toBe('state1');
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
      .initialState('state1').on('event1').transition('state2')
      .build()
      .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');
  });

  it('selects first transition for which condition is true', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('state1')
        .on('event1')
          .transition('state2').withCondition(() => false)
          .transition('state3').withCondition(() => true)
      .build()
      .handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');
  });

  it('throws if event cannot be handled', () => {
    expect(() =>
      StateMachine
        .getBuilder()
        .initialState('state1')
        .build()
        .handle('event1')
    ).toThrow('State \'state1\' cannot handle event \'event1\'.')
  });

  it('calls unhandledEvent handler', () => {
    const handler = jest.genMockFn();

    StateMachine
      .getBuilder()
      .onUnhandledEvent(handler)
      .initialState('state1')
      .build()
      .handle('event1');

    expect(handler).toBeCalledWith('event1', 'state1');
  });

  it('calls handlers with correct parameters', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .on('event1').transition('state2').withAction(mocks.transitionAction)
        .onExit(mocks.exitAction)
      .state('state2')
        .onEnter(mocks.entryAction)
      .build()
      .handle('event1');

    expect(mocks.stateExitHandler).toBeCalledWith('state1');
    expect(mocks.exitAction).toBeCalledWith('state1');
    expect(mocks.transitionHandler).toBeCalledWith('state1', 'state2');
    expect(mocks.transitionAction).toBeCalledWith('state1', 'state2');
    expect(mocks.stateEnterHandler).toBeCalledWith('state2');
    expect(mocks.entryAction).toBeCalledWith('state2');
  });

  it('calls handlers in correct order', () => {
    const calledHandlers = [];

    StateMachine
      .getBuilder()
      .onStateEnter(() => calledHandlers.push('stateEnter handler'))
      .onStateExit(() => calledHandlers.push('stateExit handler'))
      .onTransition(() => calledHandlers.push('transition handler'))
      .initialState('state1')
        .on('event')
          .transition('state2')
          .withAction(() => calledHandlers.push('state1->state2 transition action'))
        .onExit(() => calledHandlers.push('state1 exit action'))
      .state('state2')
        .onEnter(() => calledHandlers.push('state2 entry action'))
      .build()
      .handle('event');

    expect(calledHandlers).toEqual([
      'stateExit handler',
      'state1 exit action',
      'transition handler',
      'state1->state2 transition action',
      'stateEnter handler',
      'state2 entry action'
    ]);
  });

  it('calls all handlers for self-transition', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event1').selfTransition().withAction(mocks.transitionAction)
      .build()
      .handle('event1');

    expect(mocks.stateExitHandler).toBeCalledWith('state1');
    expect(mocks.exitAction).toBeCalledWith('state1');
    expect(mocks.transitionHandler).toBeCalledWith('state1', 'state1');
    expect(mocks.transitionAction).toBeCalledWith('state1', 'state1');
    expect(mocks.stateEnterHandler).toBeCalledWith('state1');
    expect(mocks.entryAction).toBeCalledWith('state1');
  });

  it('calls only transition handlers for internal transition', () => {
    const mocks = getHandlerMocks();

    StateMachine
      .getBuilder()
      .onStateEnter(mocks.stateEnterHandler)
      .onStateExit(mocks.stateExitHandler)
      .onTransition(mocks.transitionHandler)
      .initialState('state1')
        .onEnter(mocks.entryAction)
        .onExit(mocks.exitAction)
        .on('event1').internalTransition().withAction(mocks.transitionAction)
      .build()
      .handle('event1');

    expect(mocks.stateExitHandler).not.toBeCalled();
    expect(mocks.exitAction).not.toBeCalled();
    expect(mocks.transitionHandler).toBeCalledWith('state1', 'state1');
    expect(mocks.transitionAction).toBeCalledWith('state1', 'state1');
    expect(mocks.stateEnterHandler).not.toBeCalled();
    expect(mocks.entryAction).not.toBeCalled();
  });

  describe('canHandle', () => {
    it('returns true when event can be handled', () => {
      const stateMachine = StateMachine
        .getBuilder()
        .initialState('state1').on('event1').transition('state2')
        .build();

        expect(stateMachine.canHandle('event1')).toBe(true);
    });

    it('returns false when event cannot be handled', () => {
      const stateMachine = StateMachine
        .getBuilder()
        .initialState('state1')
        .build();

        expect(stateMachine.canHandle('event1')).toBe(false);
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

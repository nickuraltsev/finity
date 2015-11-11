'use strict';

jest.autoMockOff();

const StateMachine = require('..');

describe('StateMachine', () => {
  it('starts in initial state', () => {
    const stateMachine = StateMachine
      .getBuilder()
      .initialState('State')
      .build();

    expect(stateMachine.getCurrentState()).toBe('State');
  });

  it('transitions to next state on event', () => {
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

  it('calls handlers with correct parameters', () => {
    const stateEnterHandler = jest.genMockFunction();
    const stateExitHandler = jest.genMockFunction();
    const transitionHandler = jest.genMockFunction();
    const entryAction = jest.genMockFunction();
    const exitAction = jest.genMockFunction();
    const transitionAction = jest.genMockFunction();

    StateMachine
      .getBuilder()
      .onStateEnter(stateEnterHandler)
      .onStateExit(stateExitHandler)
      .onTransition(transitionHandler)
      .initialState('State1')
        .on('event').transition('State2').withAction(transitionAction)
        .onExit(exitAction)
      .state('State2')
        .onEnter(entryAction)
      .build()
      .handle('event');

    expect(stateExitHandler).toBeCalledWith('State1');
    expect(exitAction).toBeCalledWith('State1');
    expect(transitionHandler).toBeCalledWith('State1', 'State2');
    expect(transitionAction).toBeCalledWith('State1', 'State2');
    expect(stateEnterHandler).toBeCalledWith('State2');
    expect(entryAction).toBeCalledWith('State2');
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
    const stateEnterHandler = jest.genMockFunction();
    const stateExitHandler = jest.genMockFunction();
    const transitionHandler = jest.genMockFunction();
    const entryAction = jest.genMockFunction();
    const exitAction = jest.genMockFunction();
    const transitionAction = jest.genMockFunction();

    StateMachine
      .getBuilder()
      .onStateEnter(stateEnterHandler)
      .onStateExit(stateExitHandler)
      .onTransition(transitionHandler)
      .initialState('State')
        .onEnter(entryAction)
        .onExit(exitAction)
        .on('event').selfTransition().withAction(transitionAction)
      .build()
      .handle('event');

    expect(stateExitHandler).toBeCalledWith('State');
    expect(exitAction).toBeCalledWith('State');
    expect(transitionHandler).toBeCalledWith('State', 'State');
    expect(transitionAction).toBeCalledWith('State', 'State');
    expect(stateEnterHandler).toBeCalledWith('State');
    expect(entryAction).toBeCalledWith('State');
  });

  it('calls only transition handlers for internal transition', () => {
    const stateEnterHandler = jest.genMockFunction();
    const stateExitHandler = jest.genMockFunction();
    const transitionHandler = jest.genMockFunction();
    const entryAction = jest.genMockFunction();
    const exitAction = jest.genMockFunction();
    const transitionAction = jest.genMockFunction();

    StateMachine
      .getBuilder()
      .onStateEnter(stateEnterHandler)
      .onStateExit(stateExitHandler)
      .onTransition(transitionHandler)
      .initialState('State')
        .onEnter(entryAction)
        .onExit(exitAction)
        .on('event').internalTransition().withAction(transitionAction)
      .build()
      .handle('event');

    expect(stateExitHandler).not.toBeCalled();
    expect(exitAction).not.toBeCalled();
    expect(transitionHandler).toBeCalledWith('State', 'State');
    expect(transitionAction).toBeCalledWith('State', 'State');
    expect(stateEnterHandler).not.toBeCalled();
    expect(entryAction).not.toBeCalled();
  });
});

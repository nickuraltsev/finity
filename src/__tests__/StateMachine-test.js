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
      .initialState('State1')
        .on('event').transition('State2')
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

  it('calls handlers in correct order', () => {
    const calledHandlers = [];

    const stateMachine = StateMachine
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
});

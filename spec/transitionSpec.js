import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('transition', () => {
  it('executes actions and global hooks in the correct order with the correct parameters', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global()
        .onStateEnter(mocks.onStateEnterHook)
        .onStateExit(mocks.onStateExitHook)
        .onStateChange(mocks.onStateChangeHook)
        .onTransition(mocks.onTransitionHook)
      .initialState('state1')
        .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state2')
        .onEnter(mocks.stateEntryAction)
      .start();

    mocks.reset();

    stateMachine.handle('event1', 'payload1');

    const context = { stateMachine, event: 'event1', payload: 'payload1' };

    expect(mocks.calledHandlers).toEqual([
      ['onStateExitHook', 'state1', context],
      ['stateExitAction', 'state1', context],
      ['onTransitionHook', 'state1', 'state2', context],
      ['transitionAction', 'state1', 'state2', context],
      ['onStateEnterHook', 'state2', context],
      ['stateEntryAction', 'state2', context],
      ['onStateChangeHook', 'state1', 'state2', context],
    ]);
  });
});

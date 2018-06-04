import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

describe('transition', () => {
  it('executes actions and global hooks in the correct order with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await (Finity
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHook)
        .onStateExit(mocks.stateExitHook)
        .onStateChange(mocks.stateChangeHook)
        .onTransition(mocks.transitionHook)
      .initialState('state1')
        .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state2')
        .onEnter(mocks.stateEntryAction)
      .start());

    mocks.reset();

    await stateMachine.handle('event1', 'payload1');

    const context = { stateMachine, event: 'event1', eventPayload: 'payload1' };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitHook', 'state1', context],
      ['stateExitAction', 'state1', context],
      ['transitionHook', 'state1', 'state2', context],
      ['transitionAction', 'state1', 'state2', context],
      ['stateEnterHook', 'state2', context],
      ['stateEntryAction', 'state2', context],
      ['stateChangeHook', 'state1', 'state2', context],
    ]);
  });
});

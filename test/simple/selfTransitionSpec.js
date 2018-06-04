import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

describe('self-transition', () => {
  it('executes actions and global hooks in the correct order with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHook)
        .onStateExit(mocks.stateExitHook)
        .onTransition(mocks.transitionHook)
      .initialState('state1')
        .onEnter(mocks.stateEntryAction)
        .onExit(mocks.stateExitAction)
        .on('event1').selfTransition().withAction(mocks.transitionAction)
      .start();

    mocks.reset();

    await stateMachine.handle('event1');

    const context = { stateMachine, event: 'event1' };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitHook', 'state1', context],
      ['stateExitAction', 'state1', context],
      ['transitionHook', 'state1', 'state1', context],
      ['transitionAction', 'state1', 'state1', context],
      ['stateEnterHook', 'state1', context],
      ['stateEntryAction', 'state1', context],
    ]);
  });

  it('does not execute onStateChange hooks', async () => {
    const stateChangeHook = jasmine.createSpy('stateChangeHook');

    const stateMachine = await Finity
      .configure()
      .global().onStateChange(stateChangeHook)
      .initialState('state1')
        .on('event1').selfTransition()
      .start();

    await stateMachine.handle('event1');

    expect(stateChangeHook).not.toHaveBeenCalled();
  });
});

import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('self-transition', () => {
  it('executes actions and global hooks in the correct order with the correct parameters', () => {
    const mocks = new HandlerMocks();

    const stateMachine = StateMachine
      .configure()
      .global()
        .onStateEnter(mocks.onStateEnterHook)
        .onStateExit(mocks.onStateExitHook)
        .onTransition(mocks.onTransitionHook)
      .initialState('state1')
        .onEnter(mocks.stateEntryAction)
        .onExit(mocks.stateExitAction)
        .on('event1').selfTransition().withAction(mocks.transitionAction)
      .start();

    mocks.reset();

    stateMachine.handle('event1');

    const context = { stateMachine, event: 'event1' };

    expect(mocks.calledHandlers).toEqual([
      ['onStateExitHook', 'state1', context],
      ['stateExitAction', 'state1', context],
      ['onTransitionHook', 'state1', 'state1', context],
      ['transitionAction', 'state1', 'state1', context],
      ['onStateEnterHook', 'state1', context],
      ['stateEntryAction', 'state1', context],
    ]);
  });

  it('does not execute onStateChange hooks', () => {
    const onStateChangeHook = jasmine.createSpy('onStateChangeHook');

    StateMachine
      .configure()
      .global().onStateChange(onStateChangeHook)
      .initialState('state1')
        .on('event1').selfTransition()
      .start()
      .handle('event1');

    expect(onStateChangeHook).not.toHaveBeenCalled();
  });
});

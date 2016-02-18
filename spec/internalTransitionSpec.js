import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('internal transition', () => {
  it(
    'executes onTransition global hooks and transition actions with the correct parameters',
    () => {
      const mocks = new HandlerMocks();

      const stateMachine = StateMachine
        .configure()
        .global().onTransition(mocks.onTransitionHook)
        .initialState('state1')
          .on('event1').internalTransition().withAction(mocks.transitionAction)
        .start();

      mocks.reset();

      stateMachine.handle('event1');

      const context = { stateMachine, event: 'event1' };

      expect(mocks.calledHandlers).toEqual([
        ['onTransitionHook', 'state1', 'state1', context],
        ['transitionAction', 'state1', 'state1', context],
      ]);
    }
  );

  it(
    'executes no global hooks or actions other than onTransition hooks and transition actions',
    () => {
      const mocks = new HandlerMocks();

      const stateMachine = StateMachine
        .configure()
        .global()
          .onStateEnter(mocks.onStateEnterHook)
          .onStateExit(mocks.onStateExitHook)
          .onStateChange(mocks.onStateChangeHook)
        .initialState('state1')
          .onEnter(mocks.stateEntryAction)
          .onExit(mocks.stateExitAction)
          .on('event1').internalTransition()
        .start();

      mocks.reset();

      stateMachine.handle('event1');

      expect(mocks.onStateEnterHook).not.toHaveBeenCalled();
      expect(mocks.onStateExitHook).not.toHaveBeenCalled();
      expect(mocks.onStateChangeHook).not.toHaveBeenCalled();
      expect(mocks.stateEntryAction).not.toHaveBeenCalled();
      expect(mocks.stateExitAction).not.toHaveBeenCalled();
    }
  );
});

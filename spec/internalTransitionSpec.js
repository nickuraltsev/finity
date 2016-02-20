import StateMachine from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('internal transition', () => {
  it(
    'executes onTransition global hooks and transition actions with the correct parameters',
    () => {
      const mocks = new HandlerMocks();

      const stateMachine = StateMachine
        .configure()
        .global().onTransition(mocks.transitionHook)
        .initialState('state1')
          .on('event1').internalTransition().withAction(mocks.transitionAction)
        .start();

      mocks.reset();

      stateMachine.handle('event1');

      const context = { stateMachine, event: 'event1' };

      expect(mocks.calledHandlers).toEqual([
        ['transitionHook', 'state1', 'state1', context],
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
          .onStateEnter(mocks.stateEnterHook)
          .onStateExit(mocks.stateExitHook)
          .onStateChange(mocks.stateChangeHook)
        .initialState('state1')
          .onEnter(mocks.stateEntryAction)
          .onExit(mocks.stateExitAction)
          .on('event1').internalTransition()
        .start();

      mocks.reset();

      stateMachine.handle('event1');

      expect(mocks.stateEnterHook).not.toHaveBeenCalled();
      expect(mocks.stateExitHook).not.toHaveBeenCalled();
      expect(mocks.stateChangeHook).not.toHaveBeenCalled();
      expect(mocks.stateEntryAction).not.toHaveBeenCalled();
      expect(mocks.stateExitAction).not.toHaveBeenCalled();
    }
  );
});

import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('internal transition', () => {
  forAllTagTypesIt(
    'executes onTransition global hooks and transition actions with the correct parameters',
    async () => {
      const mocks = new HandlerMocks();

      const stateMachine = await Finity
        .configure()
        .global().onTransition(mocks.transitionHook)
        .initialState(tagFor('state1'))
          .on(tagFor('event1')).internalTransition().withAction(mocks.transitionAction)
        .start();

      mocks.reset();

      await stateMachine.handle(tagFor('event1'));

      const context = { stateMachine, event: tagFor('event1') };

      expect(mocks.calledHandlers).toEqual([
        ['transitionHook', tagFor('state1'), tagFor('state1'), context],
        ['transitionAction', tagFor('state1'), tagFor('state1'), context],
      ]);
    }
  );

  forAllTagTypesIt(
    'executes no global hooks or actions other than onTransition hooks and transition actions',
    async () => {
      const mocks = new HandlerMocks();

      const stateMachine = await Finity
        .configure()
        .global()
          .onStateEnter(mocks.stateEnterHook)
          .onStateExit(mocks.stateExitHook)
          .onStateChange(mocks.stateChangeHook)
        .initialState(tagFor('state1'))
          .onEnter(mocks.stateEntryAction)
          .onExit(mocks.stateExitAction)
          .on(tagFor('event1')).internalTransition()
        .start();

      mocks.reset();

      await stateMachine.handle(tagFor('event1'));

      expect(mocks.stateEnterHook).not.toHaveBeenCalled();
      expect(mocks.stateExitHook).not.toHaveBeenCalled();
      expect(mocks.stateChangeHook).not.toHaveBeenCalled();
      expect(mocks.stateEntryAction).not.toHaveBeenCalled();
      expect(mocks.stateExitAction).not.toHaveBeenCalled();
    }
  );
});

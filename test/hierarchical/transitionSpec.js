import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';
import stateMachineMatcher from '../support/stateMachineMatcher';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('heirarchial transition', () => {
  describe('when the target state is a submachine state', () => {
    forAllTagTypesIt('sets the state of the submachine to the submachine\'s initial state', async () => {
      const submachineConfig = Finity
        .configure()
          .initialState(tagFor('state21'))
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2'))
          .state(tagFor('state2'))
            .submachine(submachineConfig)
        .start();

      await stateMachine.handle(tagFor('event1'));

      expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state2'), tagFor('state21')]);
    });
  });

  describe('when the source and target states are submachine states', () => {
    forAllTagTypesIt('executes actions and global hooks in the correct order with the correct parameters', async () => {
      const mocks = new HandlerMocks();

      const withGlobalHooks = configurator =>
        configurator
          .global()
            .onStateEnter(mocks.stateEnterHook)
            .onStateExit(mocks.stateExitHook)
            .onStateChange(mocks.stateChangeHook)
            .onTransition(mocks.transitionHook);

      const submachine1Config = withGlobalHooks(
        Finity
          .configure()
            .initialState(tagFor('state11'))
            .onExit(mocks.stateExitAction)
      ).getConfig();

      const submachine2Config = withGlobalHooks(
        Finity
          .configure()
            .initialState(tagFor('state21'))
            .onEnter(mocks.stateEntryAction)
      ).getConfig();

      const stateMachine = await (withGlobalHooks(
        Finity
          .configure()
            .initialState(tagFor('state1'))
              .submachine(submachine1Config)
              .on(tagFor('event1')).transitionTo(tagFor('state2')).withAction(mocks.transitionAction)
              .onExit(mocks.stateExitAction)
            .state(tagFor('state2'))
              .submachine(submachine2Config)
              .onEnter(mocks.stateEntryAction)
      ).start());

      mocks.reset();

      await stateMachine.handle(tagFor('event1'));

      expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state2'), tagFor('state21')]);

      const context1 = {
        stateMachine: stateMachineMatcher(),
      };

      const context2 = {
        stateMachine,
        event: tagFor('event1'),
      };

      const context3 = {
        stateMachine: stateMachineMatcher(),
      };

      expect(mocks.calledHandlers).toEqual([
        ['stateExitHook', tagFor('state11'), context1],
        ['stateExitAction', tagFor('state11'), context1],
        ['stateExitHook', tagFor('state1'), context2],
        ['stateExitAction', tagFor('state1'), context2],
        ['transitionHook', tagFor('state1'), tagFor('state2'), context2],
        ['transitionAction', tagFor('state1'), tagFor('state2'), context2],
        ['stateEnterHook', tagFor('state2'), context2],
        ['stateEntryAction', tagFor('state2'), context2],
        ['stateChangeHook', tagFor('state1'), tagFor('state2'), context2],
        ['stateEnterHook', tagFor('state21'), context3],
        ['stateEntryAction', tagFor('state21'), context3],
      ]);
    });
  });
});

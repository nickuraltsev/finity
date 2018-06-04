import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';
import stateMachineMatcher from '../support/stateMachineMatcher';

describe('transition', () => {
  describe('when the target state is a submachine state', () => {
    it('sets the state of the submachine to the submachine\'s initial state', async () => {
      const submachineConfig = Finity
        .configure()
          .initialState('state21')
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig)
        .start();

      await stateMachine.handle('event1');

      expect(stateMachine.getStateHierarchy()).toEqual(['state2', 'state21']);
    });
  });

  describe('when the source and target states are submachine states', () => {
    it('executes actions and global hooks in the correct order with the correct parameters', async () => {
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
            .initialState('state11')
            .onExit(mocks.stateExitAction)
      ).getConfig();

      const submachine2Config = withGlobalHooks(
        Finity
          .configure()
            .initialState('state21')
            .onEnter(mocks.stateEntryAction)
      ).getConfig();

      const stateMachine = await (withGlobalHooks(
        Finity
          .configure()
            .initialState('state1')
              .submachine(submachine1Config)
              .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
              .onExit(mocks.stateExitAction)
            .state('state2')
              .submachine(submachine2Config)
              .onEnter(mocks.stateEntryAction)
      ).start());

      mocks.reset();

      await stateMachine.handle('event1');

      expect(stateMachine.getStateHierarchy()).toEqual(['state2', 'state21']);

      const context1 = {
        stateMachine: stateMachineMatcher(),
      };

      const context2 = {
        stateMachine,
        event: 'event1',
      };

      const context3 = {
        stateMachine: stateMachineMatcher(),
      };

      expect(mocks.calledHandlers).toEqual([
        ['stateExitHook', 'state11', context1],
        ['stateExitAction', 'state11', context1],
        ['stateExitHook', 'state1', context2],
        ['stateExitAction', 'state1', context2],
        ['transitionHook', 'state1', 'state2', context2],
        ['transitionAction', 'state1', 'state2', context2],
        ['stateEnterHook', 'state2', context2],
        ['stateEntryAction', 'state2', context2],
        ['stateChangeHook', 'state1', 'state2', context2],
        ['stateEnterHook', 'state21', context3],
        ['stateEntryAction', 'state21', context3],
      ]);
    });
  });
});

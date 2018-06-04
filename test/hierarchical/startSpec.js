import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';
import stateMachineMatcher from '../support/stateMachineMatcher';

describe('start', () => {
  describe('when the initial state is a submachine state', () => {
    it('sets the state of the submachine to the submachine\'s initial state', async () => {
      const submachineConfig = Finity
        .configure()
          .initialState('state11')
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState('state1')
            .submachine(submachineConfig)
        .start();

      expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state11']);
    });

    it('completes the execution of state entry actions before processing events', async () => {
      const mocks = new HandlerMocks();

      const submachineConfig = Finity
        .configure()
          .initialState('state11')
            .onEnter((state, context) => {
              context.stateMachine.handle('event2');
              // this should be called before processing the event
              mocks.stateEntryAction(state, context);
            })
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState('state1')
            .onEnter((state, context) => {
              context.stateMachine.handle('event1');
              // this should be called before processing the event
              mocks.stateEntryAction(state, context);
            })
            .submachine(submachineConfig)
            .on('event1').transitionTo('state2')
          .state('state2')
            .on('event2').transitionTo('state3')
          .global()
            .onTransition(mocks.transitionHook)
        .start();

      expect(stateMachine.getCurrentState()).toBe('state3');

      expect(mocks.calledHandlers).toEqual([
        ['stateEntryAction', 'state1', { stateMachine }],
        ['stateEntryAction', 'state11', { stateMachine: stateMachineMatcher() }],
        ['transitionHook', 'state1', 'state2', { stateMachine, event: 'event1' }],
        ['transitionHook', 'state2', 'state3', { stateMachine, event: 'event2' }],
      ]);
    });
  });
});

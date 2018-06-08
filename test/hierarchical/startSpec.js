import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';
import stateMachineMatcher from '../support/stateMachineMatcher';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('heirarchial start', () => {
  describe('when the initial state is a submachine state', () => {
    forAllTagTypesIt('sets the state of the submachine to the submachine\'s initial state', async () => {
      const submachineConfig = Finity
        .configure()
          .initialState(tagFor('state11'))
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState(tagFor('state1'))
            .submachine(submachineConfig)
        .start();

      expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state1'), tagFor('state11')]);
    });

    forAllTagTypesIt('completes the execution of state entry actions before processing events', async () => {
      const mocks = new HandlerMocks();

      const submachineConfig = Finity
        .configure()
          .initialState(tagFor('state11'))
            .onEnter((state, context) => {
              context.stateMachine.handle(tagFor('event2'));
              // this should be called before processing the event
              mocks.stateEntryAction(state, context);
            })
        .getConfig();

      const stateMachine = await Finity
        .configure()
          .initialState(tagFor('state1'))
            .onEnter((state, context) => {
              context.stateMachine.handle(tagFor('event1'));
              // this should be called before processing the event
              mocks.stateEntryAction(state, context);
            })
            .submachine(submachineConfig)
            .on(tagFor('event1')).transitionTo(tagFor('state2'))
          .state(tagFor('state2'))
            .on(tagFor('event2')).transitionTo(tagFor('state3'))
          .global()
            .onTransition(mocks.transitionHook)
        .start();

      expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));

      expect(mocks.calledHandlers).toEqual([
        ['stateEntryAction', tagFor('state1'), { stateMachine }],
        ['stateEntryAction', tagFor('state11'), { stateMachine: stateMachineMatcher() }],
        ['transitionHook', tagFor('state1'), tagFor('state2'), { stateMachine, event: tagFor('event1') }],
        ['transitionHook', tagFor('state2'), tagFor('state3'), { stateMachine, event: tagFor('event2') }],
      ]);
    });
  });
});

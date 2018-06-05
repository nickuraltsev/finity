import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('transition', () => {
  forAllTagTypesIt('executes actions and global hooks in the correct order with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHook)
        .onStateExit(mocks.stateExitHook)
        .onStateChange(mocks.stateChangeHook)
        .onTransition(mocks.transitionHook)
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state(tagFor('state2'))
        .onEnter(mocks.stateEntryAction)
      .start();

    mocks.reset();

    await stateMachine.handle(tagFor('event1'), tagFor('payload1'));

    const context = { stateMachine, event: tagFor('event1'), eventPayload: tagFor('payload1') };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitHook', tagFor('state1'), context],
      ['stateExitAction', tagFor('state1'), context],
      ['transitionHook', tagFor('state1'), tagFor('state2'), context],
      ['transitionAction', tagFor('state1'), tagFor('state2'), context],
      ['stateEnterHook', tagFor('state2'), context],
      ['stateEntryAction', tagFor('state2'), context],
      ['stateChangeHook', tagFor('state1'), tagFor('state2'), context],
    ]);
  });
});

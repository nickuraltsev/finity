import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('ignore transition', () => {
  forAllTagTypesIt('executes no global hooks or actions', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHook)
        .onStateExit(mocks.stateExitHook)
        .onStateChange(mocks.stateChangeHook)
        .onTransition(mocks.transitionHook)
      .initialState(tagFor('state1'))
        .onEnter(mocks.stateEntryAction)
        .onExit(mocks.stateExitAction)
        .on(tagFor('event1')).ignore()
      .start();

    mocks.reset();

    await stateMachine.handle(tagFor('event1'));

    expect(mocks.stateEnterHook).not.toHaveBeenCalled();
    expect(mocks.stateExitHook).not.toHaveBeenCalled();
    expect(mocks.stateChangeHook).not.toHaveBeenCalled();
    expect(mocks.transitionHook).not.toHaveBeenCalled();
    expect(mocks.stateEntryAction).not.toHaveBeenCalled();
    expect(mocks.stateExitAction).not.toHaveBeenCalled();
  });
});

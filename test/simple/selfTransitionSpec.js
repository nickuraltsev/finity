import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('self-transition', () => {
  forAllTagTypesIt('executes actions and global hooks in the correct order with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global()
        .onStateEnter(mocks.stateEnterHook)
        .onStateExit(mocks.stateExitHook)
        .onTransition(mocks.transitionHook)
      .initialState(tagFor('state1'))
        .onEnter(mocks.stateEntryAction)
        .onExit(mocks.stateExitAction)
        .on(tagFor('event1')).selfTransition().withAction(mocks.transitionAction)
      .start();

    mocks.reset();

    await stateMachine.handle(tagFor('event1'));

    const context = { stateMachine, event: tagFor('event1') };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitHook', tagFor('state1'), context],
      ['stateExitAction', tagFor('state1'), context],
      ['transitionHook', tagFor('state1'), tagFor('state1'), context],
      ['transitionAction', tagFor('state1'), tagFor('state1'), context],
      ['stateEnterHook', tagFor('state1'), context],
      ['stateEntryAction', tagFor('state1'), context],
    ]);
  });

  forAllTagTypesIt('does not execute onStateChange hooks', async () => {
    const stateChangeHook = jasmine.createSpy('stateChangeHook');

    const stateMachine = await Finity
      .configure()
      .global().onStateChange(stateChangeHook)
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).selfTransition()
      .start();

    await stateMachine.handle(tagFor('event1'));

    expect(stateChangeHook).not.toHaveBeenCalled();
  });
});

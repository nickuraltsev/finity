import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('Configurator#start', () => {
  forAllTagTypesIt('sets the state to the initial state', async () => {
    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
      .start();

    expect(stateMachine.getCurrentState()).toBe(tagFor('state1'));
  });

  forAllTagTypesIt('executes onStateEnter hooks and state entry actions with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global().onStateEnter(mocks.stateEnterHook)
      .initialState(tagFor('state1')).onEnter(mocks.stateEntryAction)
      .start();

    const context = { stateMachine };

    expect(mocks.calledHandlers).toEqual([
      ['stateEnterHook', tagFor('state1'), context],
      ['stateEntryAction', tagFor('state1'), context],
    ]);
  });

  forAllTagTypesIt('does not execute onTransition and onStateChange hooks', async () => {
    const mocks = new HandlerMocks();

    await Finity
      .configure()
      .global()
        .onTransition(mocks.transitionHook)
        .onStateChange(mocks.stateChangeHook)
      .initialState(tagFor('state1'))
      .start();

    expect(mocks.transitionHook).not.toHaveBeenCalled();
    expect(mocks.stateChangeHook).not.toHaveBeenCalled();
  });

  forAllTagTypesIt('completes the execution of initial state\'s entry actions before processing events', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await (Finity
      .configure()
      .initialState(tagFor('state1'))
        .onEnter((state, context) => {
          context.stateMachine.handle(tagFor('event1'));
          // this should be called before processing the event
          mocks.stateEntryAction(state, context);
        })
        .onEnter(mocks.stateEntryAction)
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state(tagFor('state2'))
        .onEnter(mocks.stateEntryAction)
      .start());

    expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));

    const context1 = { stateMachine };
    const context2 = { stateMachine, event: tagFor('event1') };

    expect(mocks.calledHandlers).toEqual([
      ['stateEntryAction', tagFor('state1'), context1],
      ['stateEntryAction', tagFor('state1'), context1],
      ['stateExitAction', tagFor('state1'), context2],
      ['transitionAction', tagFor('state1'), tagFor('state2'), context2],
      ['stateEntryAction', tagFor('state2'), context2],
    ]);
  });

  forAllTagTypesIt('throws when the initial state is not defined', async () => {
    let error;
    try {
      await Finity.configure().start();
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Initial state must be specified.');
  });
});

describe('Finity.start', () => {
  forAllTagTypesIt('sets the state to the initial state', async () => {
    const config = Finity
      .configure()
        .initialState(tagFor('state1'))
      .getConfig();

    const stateMachine = await Finity.start(config);
    expect(stateMachine.getCurrentState()).toBe(tagFor('state1'));
  });

  forAllTagTypesIt('throws when `configuration` is not specified', async () => {
    let error;
    try {
      await Finity.start();
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Configuration must be specified.');
  });

  forAllTagTypesIt('throws when `configuration` is null', async () => {
    let error;
    try {
      await Finity.start(null);
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Configuration must be specified.');
  });

  forAllTagTypesIt('throws when `configuration` is not an object', async () => {
    let error;
    try {
      await Finity.start(100);
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Configuration must be an object.');
  });
});

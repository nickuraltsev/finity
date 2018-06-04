import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

describe('Configurator#start', () => {
  it('sets the state to the initial state', async () => {
    const stateMachine = await Finity
      .configure()
      .initialState('state1')
      .start();

    expect(stateMachine.getCurrentState()).toBe('state1');
  });

  it('executes onStateEnter hooks and state entry actions with the correct parameters', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .global().onStateEnter(mocks.stateEnterHook)
      .initialState('state1').onEnter(mocks.stateEntryAction)
      .start();

    const context = { stateMachine };

    expect(mocks.calledHandlers).toEqual([
      ['stateEnterHook', 'state1', context],
      ['stateEntryAction', 'state1', context],
    ]);
  });

  it('does not execute onTransition and onStateChange hooks', async () => {
    const mocks = new HandlerMocks();

    await Finity
      .configure()
      .global()
        .onTransition(mocks.transitionHook)
        .onStateChange(mocks.stateChangeHook)
      .initialState('state1')
      .start();

    expect(mocks.transitionHook).not.toHaveBeenCalled();
    expect(mocks.stateChangeHook).not.toHaveBeenCalled();
  });

  it('completes the execution of initial state\'s entry actions before processing events', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await (Finity
      .configure()
      .initialState('state1')
        .onEnter((state, context) => {
          context.stateMachine.handle('event1');
          // this should be called before processing the event
          mocks.stateEntryAction(state, context);
        })
        .onEnter(mocks.stateEntryAction)
        .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state2')
        .onEnter(mocks.stateEntryAction)
      .start());

    expect(stateMachine.getCurrentState()).toBe('state2');

    const context1 = { stateMachine };
    const context2 = { stateMachine, event: 'event1' };

    expect(mocks.calledHandlers).toEqual([
      ['stateEntryAction', 'state1', context1],
      ['stateEntryAction', 'state1', context1],
      ['stateExitAction', 'state1', context2],
      ['transitionAction', 'state1', 'state2', context2],
      ['stateEntryAction', 'state2', context2],
    ]);
  });

  it('throws when the initial state is not defined', async () => {
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
  it('sets the state to the initial state', async () => {
    const config = Finity
      .configure()
        .initialState('state1')
      .getConfig();

    const stateMachine = await Finity.start(config);
    expect(stateMachine.getCurrentState()).toBe('state1');
  });

  it('throws when `configuration` is not specified', async () => {
    let error;
    try {
      await Finity.start();
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Configuration must be specified.');
  });

  it('throws when `configuration` is null', async () => {
    let error;
    try {
      await Finity.start(null);
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Configuration must be specified.');
  });

  it('throws when `configuration` is not an object', async () => {
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

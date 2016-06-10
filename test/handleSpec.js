import Finity from '../src';
import HandlerMocks from './support/HandlerMocks';

describe('handle', () => {
  describe('if there is no transition for the current state and event', () => {
    it('throws', () => {
      expect(() =>
        Finity
          .configure()
          .initialState('state1')
          .start()
          .handle('event1')
      ).toThrowError('Unhandled event \'event1\' in state \'state1\'.');
    });
  });

  describe('if there is a single transition for the current state and event', () => {
    it('executes the transition if it has no guard condition', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1').on('event1').transitionTo('state2')
        .start()
        .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('executes the transition if its guard condition is true', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2').withCondition(() => true)
        .start()
        .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('throws if the guard condition of the transition is false', () => {
      expect(() =>
        Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2').withCondition(() => false)
          .start()
          .handle('event1')
      ).toThrowError('Unhandled event \'event1\' in state \'state1\'.');
    });
  });

  describe('if there are multiple transitions for the current state and event', () => {
    it(
      'executes a transition if it has no guard condition ' +
      'and the guard condition of each preceding transition is false',
      () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3')
          .start()
          .handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state3');
      }
    );

    it(
      'executes a transition if its guard condition is true ' +
      'and the guard condition of each preceding transition is false',
      () => {
        const stateMachine = Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3').withCondition(() => true)
          .start()
          .handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state3');
      }
    );
  });

  it('passes a context object to guard conditions', () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start()
      .handle('event1');

    expect(condition).toHaveBeenCalledWith({ stateMachine, event: 'event1' });
  });

  it('supports event payloads', () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start()
      .handle('event1', 'payload1');

    expect(condition).toHaveBeenCalledWith({
      stateMachine,
      event: 'event1',
      eventPayload: 'payload1',
    });
  });

  it('calls onUnhandledEvent hooks', () => {
    const unhandledEventHook = jasmine.createSpy('unhandledEventHook');

    const stateMachine = Finity
      .configure()
      .global().onUnhandledEvent(unhandledEventHook)
      .initialState('state1')
      .start()
      .handle('event1');

    const context = { stateMachine, event: 'event1' };
    expect(unhandledEventHook).toHaveBeenCalledWith('event1', 'state1', context);
  });

  it('completes the processing of the current event before processing the next event', () => {
    const mocks = new HandlerMocks();

    const stateMachine = Finity
      .configure()
      .initialState('state1')
        .on('event1')
          .transitionTo('state2')
            .withAction(mocks.transitionAction)
        .onExit((...args) => {
          // send a new event in the middle of processing another event
          stateMachine.handle('event2');
          // this should be called before processing the new event
          mocks.stateExitAction(...args);
        })
      .state('state2')
        .onEnter(mocks.stateEntryAction)
        .on('event2')
          .transitionTo('state3')
            .withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state3')
        .onEnter(mocks.stateEntryAction)
      .start();

    mocks.reset();

    stateMachine.handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');

    const context1 = { stateMachine, event: 'event1' };
    const context2 = { stateMachine, event: 'event2' };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitAction', 'state1', context1],
      ['transitionAction', 'state1', 'state2', context1],
      ['stateEntryAction', 'state2', context1],
      ['stateExitAction', 'state2', context2],
      ['transitionAction', 'state2', 'state3', context2],
      ['stateEntryAction', 'state3', context2],
    ]);
  });
});

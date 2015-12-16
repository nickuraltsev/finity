jest.autoMockOff();

const _ = require('lodash');
const StateMachine = require('..');

function getHandlerMocks() {
  return {
    stateEnterHandler: jest.genMockFn(),
    stateExitHandler: jest.genMockFn(),
    stateChangeHandler: jest.genMockFn(),
    transitionHandler: jest.genMockFn(),
    entryAction: jest.genMockFn(),
    exitAction: jest.genMockFn(),
    transitionAction: jest.genMockFn(),
  };
}

describe('StateMachine', () => {
  describe('start', () => {
    it('starts state machine', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
        .start();

      expect(stateMachine.getCurrentState()).toBe('state1');
    });

    it('calls handlers with correct parameters', () => {
      const mocks = getHandlerMocks();

      StateMachine
        .configure()
        .global().onStateEnter(mocks.stateEnterHandler)
        .initialState('state1').onEnter(mocks.entryAction)
        .start();

      expect(mocks.stateEnterHandler).toBeCalledWith('state1');
      expect(mocks.entryAction).toBeCalledWith('state1');
    });

    it('does not call stateChange handler', () => {
      const stateChangeHandler = jest.genMockFn();

      StateMachine
        .configure()
        .global().onStateChange(stateChangeHandler)
        .initialState('state1')
        .start();

      expect(stateChangeHandler).not.toBeCalled();
    });

    it('throws if configuration is undefined', () => {
      expect(() => StateMachine.start())
        .toThrow('Configuration must be specified.');
    });

    it('throws if configuration is null', () => {
      expect(() => StateMachine.start(null))
        .toThrow('Configuration must be specified.');
    });

    it('throws if configuration is not an object', () => {
      expect(() => StateMachine.start(100))
        .toThrow('Configuration must be an object.');
    });
  });

  describe('canHandle', () => {
    it('returns true when event can be handled', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1').on('event1').transitionTo('state2')
        .start();

      expect(stateMachine.canHandle('event1')).toBe(true);
    });

    it('returns false when event cannot be handled', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
        .start();

      expect(stateMachine.canHandle('event1')).toBe(false);
    });
  });

  describe('handle', () => {
    it('transitions to next state', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1').on('event1').transitionTo('state2')
        .start()
        .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('selects first transition for which condition is true', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1')
            .transitionTo('state2').withCondition(() => false)
            .transitionTo('state3').withCondition(() => true)
        .start()
        .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state3');
    });

    it('throws if event cannot be handled', () => {
      expect(() =>
        StateMachine
          .configure()
          .initialState('state1')
          .start()
          .handle('event1')
      ).toThrow('State \'state1\' cannot handle event \'event1\'.');
    });

    it('calls unhandledEvent handler', () => {
      const handler = jest.genMockFn();

      StateMachine
        .configure()
        .global().onUnhandledEvent(handler)
        .initialState('state1')
        .start()
        .handle('event1');

      expect(handler).toBeCalledWith('event1', 'state1');
    });

    it('calls handlers with correct parameters', () => {
      const mocks = getHandlerMocks();

      StateMachine
        .configure()
        .global()
          .onStateEnter(mocks.stateEnterHandler)
          .onStateExit(mocks.stateExitHandler)
          .onStateChange(mocks.stateChangeHandler)
          .onTransition(mocks.transitionHandler)
        .initialState('state1')
          .on('event1').transitionTo('state2').withAction(mocks.transitionAction)
          .onExit(mocks.exitAction)
        .state('state2')
          .onEnter(mocks.entryAction)
        .start()
        .handle('event1');

      expect(mocks.stateEnterHandler).toBeCalledWith('state1');
      expect(mocks.stateExitHandler).toBeCalledWith('state1');
      expect(mocks.exitAction).toBeCalledWith('state1');
      expect(mocks.transitionHandler).toBeCalledWith('state1', 'state2');
      expect(mocks.transitionAction).toBeCalledWith('state1', 'state2');
      expect(mocks.stateEnterHandler).toBeCalledWith('state2');
      expect(mocks.entryAction).toBeCalledWith('state2');
      expect(mocks.stateChangeHandler).toBeCalledWith('state1', 'state2');
    });

    it('calls handlers in correct order', () => {
      const calledHandlers = [];

      StateMachine
        .configure()
        .global()
          .onStateEnter(() => calledHandlers.push('stateEnter handler'))
          .onStateExit(() => calledHandlers.push('stateExit handler'))
          .onStateChange(() => calledHandlers.push('stateChange handler'))
          .onTransition(() => calledHandlers.push('transition handler'))
        .initialState('state1')
          .onEnter(() => calledHandlers.push('state1 entry action'))
          .on('event')
            .transitionTo('state2')
              .withAction(() => calledHandlers.push('state1->state2 transition action'))
          .onExit(() => calledHandlers.push('state1 exit action'))
        .state('state2')
          .onEnter(() => calledHandlers.push('state2 entry action'))
        .start()
        .handle('event');

      expect(calledHandlers).toEqual([
        'stateEnter handler',
        'state1 entry action',
        'stateExit handler',
        'state1 exit action',
        'transition handler',
        'state1->state2 transition action',
        'stateEnter handler',
        'state2 entry action',
        'stateChange handler',
      ]);
    });

    it('calls handlers for self-transition', () => {
      const mocks = getHandlerMocks();

      const stateMachine = StateMachine
        .configure()
        .global()
          .onStateEnter(mocks.stateEnterHandler)
          .onStateExit(mocks.stateExitHandler)
          .onTransition(mocks.transitionHandler)
        .initialState('state1')
          .onEnter(mocks.entryAction)
          .onExit(mocks.exitAction)
          .on('event1').selfTransition().withAction(mocks.transitionAction)
        .start();

      _.forOwn(mocks, handler => handler.mockClear());

      stateMachine.handle('event1');

      expect(mocks.stateExitHandler).toBeCalledWith('state1');
      expect(mocks.exitAction).toBeCalledWith('state1');
      expect(mocks.transitionHandler).toBeCalledWith('state1', 'state1');
      expect(mocks.transitionAction).toBeCalledWith('state1', 'state1');
      expect(mocks.stateEnterHandler).toBeCalledWith('state1');
      expect(mocks.entryAction).toBeCalledWith('state1');
    });

    it('does not call stateChange handler for self-transition', () => {
      const stateChangeHandler = jest.genMockFn();

      StateMachine
        .configure()
        .global().onStateChange(stateChangeHandler)
        .initialState('state1')
          .on('event1').selfTransition()
        .start()
        .handle('event1');

      expect(stateChangeHandler).not.toBeCalled();
    });

    it('calls only transition handlers for internal transition', () => {
      const mocks = getHandlerMocks();

      const stateMachine = StateMachine
        .configure()
        .global()
          .onStateEnter(mocks.stateEnterHandler)
          .onStateExit(mocks.stateExitHandler)
          .onStateChange(mocks.stateChangeHandler)
          .onTransition(mocks.transitionHandler)
        .initialState('state1')
          .onEnter(mocks.entryAction)
          .onExit(mocks.exitAction)
          .on('event1').internalTransition().withAction(mocks.transitionAction)
        .start();

      _.forOwn(mocks, handler => handler.mockClear());

      stateMachine.handle('event1');

      expect(mocks.stateExitHandler).not.toBeCalled();
      expect(mocks.exitAction).not.toBeCalled();
      expect(mocks.transitionHandler).toBeCalledWith('state1', 'state1');
      expect(mocks.transitionAction).toBeCalledWith('state1', 'state1');
      expect(mocks.stateEnterHandler).not.toBeCalled();
      expect(mocks.entryAction).not.toBeCalled();
      expect(mocks.stateChangeHandler).not.toBeCalled();
    });

    it('handles event fired from action', () => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .onEnter(() => stateMachine.handle('event2'))
          .on('event2').transitionTo('state3')
        .start();

      stateMachine.handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state3');
    });

    it('handles event fired from action after current transition is completed', () => {
      const executedActions = [];

      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1')
            .transitionTo('state2')
              .withAction(() => executedActions.push('state1->state2 transition action'))
          .onExit(() => {
            stateMachine.handle('event2');
            executedActions.push('state1 exit action');
          })
        .state('state2')
          .onEnter(() => executedActions.push('state2 entry action'))
          .on('event2')
            .transitionTo('state3')
              .withAction(() => executedActions.push('state2->state3 transition action'))
          .onExit(() => executedActions.push('state2 exit action'))
        .state('state3')
          .onEnter(() => executedActions.push('state3 entry action'))
        .start();

      stateMachine.handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state3');

      expect(executedActions).toEqual([
        'state1 exit action',
        'state1->state2 transition action',
        'state2 entry action',
        'state2 exit action',
        'state2->state3 transition action',
        'state3 entry action',
      ]);
    });
  });
});

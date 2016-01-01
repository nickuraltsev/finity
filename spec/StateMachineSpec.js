import _ from 'lodash';
import StateMachine from '../src';

function getHandlerMocks() {
  return {
    stateEnterHandler: jasmine.createSpy(),
    stateExitHandler: jasmine.createSpy(),
    stateChangeHandler: jasmine.createSpy(),
    transitionHandler: jasmine.createSpy(),
    entryAction: jasmine.createSpy(),
    exitAction: jasmine.createSpy(),
    transitionAction: jasmine.createSpy(),
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

      expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1');
      expect(mocks.entryAction).toHaveBeenCalledWith('state1');
    });

    it('does not call stateChange handler', () => {
      const stateChangeHandler = jasmine.createSpy();

      StateMachine
        .configure()
        .global().onStateChange(stateChangeHandler)
        .initialState('state1')
        .start();

      expect(stateChangeHandler).not.toHaveBeenCalled();
    });

    it('throws if configuration is undefined', () => {
      expect(() => StateMachine.start())
        .toThrowError('Configuration must be specified.');
    });

    it('throws if configuration is null', () => {
      expect(() => StateMachine.start(null))
        .toThrowError('Configuration must be specified.');
    });

    it('throws if configuration is not an object', () => {
      expect(() => StateMachine.start(100))
        .toThrowError('Configuration must be an object.');
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
      ).toThrowError('State \'state1\' cannot handle event \'event1\'.');
    });

    it('calls unhandledEvent handler', () => {
      const handler = jasmine.createSpy();

      StateMachine
        .configure()
        .global().onUnhandledEvent(handler)
        .initialState('state1')
        .start()
        .handle('event1');

      expect(handler).toHaveBeenCalledWith('event1', 'state1');
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

      expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1');
      expect(mocks.stateExitHandler).toHaveBeenCalledWith('state1');
      expect(mocks.exitAction).toHaveBeenCalledWith('state1');
      expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state2');
      expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state2');
      expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state2');
      expect(mocks.entryAction).toHaveBeenCalledWith('state2');
      expect(mocks.stateChangeHandler).toHaveBeenCalledWith('state1', 'state2');
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

      _.forOwn(mocks, handler => handler.calls.reset());

      stateMachine.handle('event1');

      expect(mocks.stateExitHandler).toHaveBeenCalledWith('state1');
      expect(mocks.exitAction).toHaveBeenCalledWith('state1');
      expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state1');
      expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state1');
      expect(mocks.stateEnterHandler).toHaveBeenCalledWith('state1');
      expect(mocks.entryAction).toHaveBeenCalledWith('state1');
    });

    it('does not call stateChange handler for self-transition', () => {
      const stateChangeHandler = jasmine.createSpy();

      StateMachine
        .configure()
        .global().onStateChange(stateChangeHandler)
        .initialState('state1')
          .on('event1').selfTransition()
        .start()
        .handle('event1');

      expect(stateChangeHandler).not.toHaveBeenCalled();
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

      _.forOwn(mocks, handler => handler.calls.reset());

      stateMachine.handle('event1');

      expect(mocks.stateExitHandler).not.toHaveBeenCalled();
      expect(mocks.exitAction).not.toHaveBeenCalled();
      expect(mocks.transitionHandler).toHaveBeenCalledWith('state1', 'state1');
      expect(mocks.transitionAction).toHaveBeenCalledWith('state1', 'state1');
      expect(mocks.stateEnterHandler).not.toHaveBeenCalled();
      expect(mocks.entryAction).not.toHaveBeenCalled();
      expect(mocks.stateChangeHandler).not.toHaveBeenCalled();
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

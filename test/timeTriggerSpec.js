import Finity from '../src';

describe('time trigger', () => {
  beforeEach(() => jasmine.clock().install());

  afterEach(() => jasmine.clock().uninstall());

  describe('when defined for the initial state', () => {
    it('executes the correct transition on timeout', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1').onTimeout(100).transitionTo('state2')
        .start();

      expect(stateMachine.getCurrentState()).toBe('state1');

      jasmine.clock().tick(100);

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('executes no transition when the state has been exited', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
          .onTimeout(100).transitionTo('state3')
        .start()
        .handle('event1');

      jasmine.clock().tick(100);

      expect(stateMachine.getCurrentState()).toBe('state2');
    });
  });

  describe('when defined for a non-initial state', () => {
    it('executes the correct transition on timeout', () => {
      const stateMachine = Finity
        .configure()
        .initialState('state1').on('event1').transitionTo('state2')
        .state('state2').onTimeout(100).transitionTo('state3')
        .start()
        .handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');

      jasmine.clock().tick(100);

      expect(stateMachine.getCurrentState()).toBe('state3');
    });
  });
});

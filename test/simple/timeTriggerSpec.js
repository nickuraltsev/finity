import Finity from '../../src';

describe('time trigger', () => {
  describe('when defined for the initial state', () => {
    it('executes the correct transition on timeout', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState('state1').onTimeout(100).transitionTo('state2')
        .start();

      expect(stateMachine.getCurrentState()).toBe('state1');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('executes no transition when the state has been exited', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
          .onTimeout(100).transitionTo('state3')
        .start();

      await stateMachine.handle('event1');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe('state2');
    });
  });

  describe('when defined for a non-initial state', () => {
    it('executes the correct transition on timeout', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState('state1').on('event1').transitionTo('state2')
        .state('state2').onTimeout(100).transitionTo('state3')
        .start();

      await stateMachine.handle('event1');

      expect(stateMachine.getCurrentState()).toBe('state2');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe('state3');
    });
  });
});

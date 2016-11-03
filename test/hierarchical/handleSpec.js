import Finity from '../../src';

describe('handle', () => {
  describe('when the child state machine is the innermost state machine that can handle the event', () => {
    it('passes the event to the child state machine', () => {
      const submachineConfig = Finity
        .configure()
          .initialState('state21')
            .on('event2').transitionTo('state22')
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig)
        .start()
        .handle('event1')
        .handle('event2');

      expect(stateMachine.getStateHierarchy()).toEqual(['state2', 'state22']);
    });
  });

  describe('when the grandchild state machine is the innermost state machine that can handle the event', () => {
    it('passes the event to the grandchild state machine', () => {
      const submachineConfig1 = Finity
        .configure()
          .initialState('state221')
            .on('event3').transitionTo('state222')
        .getConfig();

      const submachineConfig2 = Finity
        .configure()
          .initialState('state21')
            .on('event2').transitionTo('state22')
          .state('state22')
            .submachine(submachineConfig1)
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig2)
            .on('event3').transitionTo('state3')
        .start();

      for (let i = 1; i <= 3; i++) {
        stateMachine.handle(`event${i}`);
      }

      expect(stateMachine.getStateHierarchy()).toEqual(['state2', 'state22', 'state222']);
    });
  });

  describe('when the current state machine is the innermost state machine that can handle the event', () => {
    it('passes the event to the current state machine', () => {
      const submachineConfig = Finity
        .configure()
          .initialState('state21')
            .on('event2').transitionTo('state22')
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig)
            .on('event3').transitionTo('state3')
        .start();

      for (let i = 1; i <= 3; i++) {
        stateMachine.handle(`event${i}`);
      }

      expect(stateMachine.getStateHierarchy()).toEqual(['state3']);
    });
  });

  describe('when the parent state machine is the innermost state machine that can handle the event', () => {
    it('passes the event to the parent state machine', () => {
      const submachineConfig = Finity
        .configure()
          .initialState('state21')
            .on('event2').transitionTo('state22')
          .state('state22')
            .onEnter((state, context) => context.stateMachine.handle('event3'))
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig)
            .on('event3').transitionTo('state3')
        .start()
        .handle('event1')
        .handle('event2');

      expect(stateMachine.getStateHierarchy()).toEqual(['state3']);
    });
  });

  describe('when multiple state machines in the hierarchy can handle the event', () => {
    it('passes the event to the innermost one', () => {
      const submachineConfig1 = Finity
        .configure()
          .initialState('state221')
            .on('event3').transitionTo('state222')
          .state('state222')
            .on('event4').transitionTo('state223')
        .getConfig();

      const submachineConfig2 = Finity
        .configure()
          .initialState('state21')
            .on('event2').transitionTo('state22')
          .state('state22')
            .submachine(submachineConfig1)
            .on('event4').transitionTo('state23')
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .state('state2')
            .submachine(submachineConfig2)
            .on('event4').transitionTo('state3')
        .start();

      for (let i = 1; i <= 4; i++) {
        stateMachine.handle(`event${i}`);
      }

      expect(stateMachine.getStateHierarchy()).toEqual(['state2', 'state22', 'state223']);
    });
  });
});

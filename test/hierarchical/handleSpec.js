import Finity from '../../src';

describe('handle', () => {
  let stateMachine;

  beforeEach(() => {
    const grandchildConfig = Finity
      .configure()
        .initialState('state111')
        .on('event3').transitionTo('state112')
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState('state11')
          .submachine(grandchildConfig)
          .on('event2').transitionTo('state12')
      .getConfig();

    stateMachine = Finity
      .configure()
        .initialState('state1')
          .submachine(childConfig)
          .on('event1').transitionTo('state2')
      .start();
  });

  describe(
    'when the child state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the child state machine', () => {
        stateMachine.handle('event2');
        expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state12']);
      });
    }
  );

  describe(
    'when the grandchild state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the grandchild state machine', () => {
        stateMachine.handle('event3');
        expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state11', 'state112']);
      });
    }
  );

  describe(
    'when the current state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the current state machine', () => {
        stateMachine.handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
    }
  );

  describe(
    'when the parent state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the parent state machine', () => {
        stateMachine
          .getSubmachine('state1')
          .handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
    }
  );

  describe(
    'when the grandparent state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the grandparent state machine', () => {
        stateMachine
          .getSubmachine('state1')
          .getSubmachine('state11')
          .handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
    }
  );

  describe('when multiple state machines in the hierarchy can handle the event', () => {
    it('passes the event to the innermost one', () => {
      const grandchildConfig = Finity
        .configure()
          .initialState('state111')
            .on('event1').transitionTo('state112')
        .getConfig();

      const childConfig = Finity
        .configure()
          .initialState('state11')
            .submachine(grandchildConfig)
            .on('event1').transitionTo('state12')
        .getConfig();

      const stateMachine = Finity
        .configure()
          .initialState('state1')
            .submachine(childConfig)
            .on('event1').transitionTo('state2')
        .start();

      stateMachine.handle('event1');

      expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state11', 'state112']);
    });
  });

  describe('when no state machine in the hierarchy can handle the event', () => {
    it('throws', () => {
      const child = stateMachine.getSubmachine('state1');
      expect(() => child.handle('non-handleable'))
        .toThrowError('Unhandled event \'non-handleable\' in state \'state1\'.');
    });
  });
});

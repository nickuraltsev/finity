import Finity from '../../src';

describe('handle', () => {
  let stateMachine;

  beforeEach(async () => {
    const grandchildConfig = Finity
      .configure()
        .initialState('state111')
        .on('event3')
          .transitionTo('state112').withAction(() => 'action3')
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState('state11')
          .submachine(grandchildConfig)
          .on('event2')
            .transitionTo('state12').withAction(() => 'action2')
      .getConfig();

    stateMachine = await Finity
      .configure()
        .initialState('state1')
          .submachine(childConfig)
          .on('event1')
            .transitionTo('state2').withAction(() => 'action1')
      .start();
  });

  describe(
    'when the child state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the child state machine', async () => {
        await stateMachine.handle('event2');
        expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state12']);
      });
      it('returns the value from the child state machine', async () => {
        expect(await stateMachine.handle('event2')).toBe('action2');
      });
    }
  );

  describe(
    'when the grandchild state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the grandchild state machine', async () => {
        await stateMachine.handle('event3');
        expect(stateMachine.getStateHierarchy()).toEqual(['state1', 'state11', 'state112']);
      });
      it('returns the value from the grandchild state machine', async () => {
        expect(await stateMachine.handle('event3')).toBe('action3');
      });
    }
  );

  describe(
    'when the current state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the current state machine', async () => {
        await stateMachine.handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
      it('returns the value from the current state machine', async () => {
        expect(await stateMachine.handle('event1')).toBe('action1');
      });
    }
  );

  describe(
    'when the parent state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the parent state machine', async () => {
        await stateMachine
          .getSubmachine()
          .handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
      it('returns the value from the parent state machine', async () => {
        expect(await stateMachine.getSubmachine().handle('event1')).toBe('action1');
      });
    }
  );

  describe(
    'when the grandparent state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the grandparent state machine', async () => {
        await stateMachine
          .getSubmachine()
          .getSubmachine()
          .handle('event1');
        expect(stateMachine.getStateHierarchy()).toEqual(['state2']);
      });
    }
  );

  describe('when multiple state machines in the hierarchy can handle the event', () => {
    it('passes the event to the innermost one', async () => {
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

      // eslint-disable-next-line no-shadow
      const stateMachine = await Finity
        .configure()
          .initialState('state1')
            .submachine(childConfig)
            .on('event1').transitionTo('state2')
        .start();

      await stateMachine.handle('event1');

      expect(
        stateMachine.getStateHierarchy()
      ).toEqual(['state1', 'state11', 'state112']);
    });
  });

  describe('when no state machine in the hierarchy can handle the event', () => {
    it('throws', async () => {
      const child = stateMachine.getSubmachine();

      let error;
      try {
        await child.handle('non-handleable');
      } catch (e) {
        error = e;
      }

      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('Unhandled event \'non-handleable\' in state \'state11\'.');
    });
  });
});

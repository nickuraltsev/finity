import Finity from '../../src';
import { UnhandledEventError } from '../../src/core/Errors';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describeForAllTagTypes('heirarchial handle', () => {
  let stateMachine;

  beforeEach(async () => {
    const grandchildConfig = Finity
      .configure()
        .initialState(tagFor('state111'))
        .on(tagFor('event3'))
          .transitionTo(tagFor('state112')).withAction(() => tagFor('action3'))
      .getConfig();

    const childConfig = Finity
      .configure()
        .initialState(tagFor('state11'))
          .submachine(grandchildConfig)
          .on(tagFor('event2'))
            .transitionTo(tagFor('state12')).withAction(() => tagFor('action2'))
      .getConfig();

    stateMachine = await Finity
      .configure()
        .initialState(tagFor('state1'))
          .submachine(childConfig)
          .on(tagFor('event1'))
            .transitionTo(tagFor('state2')).withAction(() => tagFor('action1'))
      .start();
  });

  describe(
    'when the child state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the child state machine', async () => {
        await stateMachine.handle(tagFor('event2'));
        expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state1'), tagFor('state12')]);
      });
      it('returns the value from the child state machine', async () => {
        expect(await stateMachine.handle(tagFor('event2'))).toBe(tagFor('action2'));
      });
    }
  );

  describe(
    'when the grandchild state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the grandchild state machine', async () => {
        await stateMachine.handle(tagFor('event3'));
        expect(stateMachine.getStateHierarchy()).toEqual([
          tagFor('state1'),
          tagFor('state11'),
          tagFor('state112'),
        ]);
      });
      it('returns the value from the grandchild state machine', async () => {
        expect(await stateMachine.handle(tagFor('event3'))).toBe(tagFor('action3'));
      });
    }
  );

  describe(
    'when the current state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the current state machine', async () => {
        await stateMachine.handle(tagFor('event1'));
        expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state2')]);
      });
      it('returns the value from the current state machine', async () => {
        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action1'));
      });
    }
  );

  describe(
    'when the parent state machine is the innermost state machine that can handle the event',
    () => {
      it('passes the event to the parent state machine', async () => {
        await stateMachine
          .getSubmachine()
          .handle(tagFor('event1'));
        expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state2')]);
      });
      it('returns the value from the parent state machine', async () => {
        expect(await stateMachine.getSubmachine().handle(tagFor('event1'))).toBe(tagFor('action1'));
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
          .handle(tagFor('event1'));
        expect(stateMachine.getStateHierarchy()).toEqual([tagFor('state2')]);
      });
    }
  );

  describe('when multiple state machines in the hierarchy can handle the event', () => {
    it('passes the event to the innermost one', async () => {
      const grandchildConfig = Finity
        .configure()
          .initialState(tagFor('state111'))
            .on(tagFor('event1')).transitionTo(tagFor('state112'))
        .getConfig();

      const childConfig = Finity
        .configure()
          .initialState(tagFor('state11'))
            .submachine(grandchildConfig)
            .on(tagFor('event1')).transitionTo(tagFor('state12'))
        .getConfig();

      // eslint-disable-next-line no-shadow
      const stateMachine = await Finity
        .configure()
          .initialState(tagFor('state1'))
            .submachine(childConfig)
            .on(tagFor('event1')).transitionTo(tagFor('state2'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      expect(
        stateMachine.getStateHierarchy()
      ).toEqual([tagFor('state1'), tagFor('state11'), tagFor('state112')]);
    });
  });

  describe('when no state machine in the hierarchy can handle the event', () => {
    it('throws', async () => {
      const child = stateMachine.getSubmachine();

      let error;
      try {
        await child.handle(tagFor('nonHandleable'));
      } catch (e) {
        error = e;
      }

      expect(error instanceof UnhandledEventError).toBe(true);
      expect(error.event).toBe(tagFor('nonHandleable'));
      expect(error.state).toBe(tagFor('state11'));
    });
  });
});

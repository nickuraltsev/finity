import Finity from '../../src';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('canHandle', () => {
  describe('when there are no transitions for the current state and event', () => {
    forAllTagTypesIt('returns false', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
        .start();

      expect(await stateMachine.canHandle(tagFor('event1'))).toBe(false);
    });
  });

  describe('when there is a single transition for the current state and event', () => {
    describe('when the transition has no guard condition', () => {
      forAllTagTypesIt('returns true', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1')).on(tagFor('event1')).transitionTo(tagFor('state2'))
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(true);
      });
    });

    describe('when the guard condition of the transition is true', () => {
      forAllTagTypesIt('returns true', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => true)
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(true);
      });
    });

    describe('when the guard condition of the transition is false', () => {
      forAllTagTypesIt('returns false', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => false)
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(false);
      });
    });
  });

  describe('when there are multiple transitions for the current state and event', () => {
    describe('when one of the transitions has no guard condition', () => {
      forAllTagTypesIt('returns true', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3'))
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(true);
      });
    });


    describe('when the guard condition of one of the transitions is true', () => {
      forAllTagTypesIt('returns true', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3')).withCondition(() => true)
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(true);
      });
    });

    describe('when the guard condition of each transition is false', () => {
      forAllTagTypesIt('returns false', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3')).withCondition(() => false)
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(false);
      });
    });
  });

  describe('when there is a single catch-all transition and no event-specific transitions', () => {
    describe('when the catch-all transition is allowed', () => {
      forAllTagTypesIt('returns true', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .onAny().transitionTo(tagFor('state2'))
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(true);
      });
    });

    describe('when the catch-all transition is not allowed', () => {
      forAllTagTypesIt('returns false', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .onAny().transitionTo(tagFor('state2')).withCondition(() => false)
          .start();

        expect(await stateMachine.canHandle(tagFor('event1'))).toBe(false);
      });
    });
  });

  forAllTagTypesIt('passes a context object to guard conditions', async () => {
    const condition = jasmine.createSpy('condition');

    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(condition)
      .start();

    await stateMachine.canHandle(tagFor('event1'));

    expect(condition).toHaveBeenCalledWith({ stateMachine, event: tagFor('event1') });
  });

  forAllTagTypesIt('adds the event payload to the context object', async () => {
    const condition = jasmine.createSpy('condition');

    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(condition)
      .start();

    await stateMachine.canHandle(tagFor('event1'), tagFor('payload1'));

    expect(condition).toHaveBeenCalledWith({
      stateMachine,
      event: tagFor('event1'),
      eventPayload: tagFor('payload1'),
    });
  });
});

import Finity from '../../src';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('time trigger', () => {
  describe('when defined for the initial state', () => {
    forAllTagTypesIt('executes the correct transition on timeout', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1')).onTimeout(100).transitionTo(tagFor('state2'))
        .start();

      expect(stateMachine.getCurrentState()).toBe(tagFor('state1'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
    });

    forAllTagTypesIt('executes no transition when the state has been exited', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .on(tagFor('event1')).transitionTo(tagFor('state2'))
          .onTimeout(100).transitionTo(tagFor('state3'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
    });
  });

  describe('when defined for a non-initial state', () => {
    forAllTagTypesIt('executes the correct transition on timeout', async () => {
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1')).on(tagFor('event1')).transitionTo(tagFor('state2'))
        .state(tagFor('state2')).onTimeout(100).transitionTo(tagFor('state3'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
    });
  });
});

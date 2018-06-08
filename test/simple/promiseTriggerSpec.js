import Finity from '../../src';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('promise trigger', () => {
  describe('when defined for the initial state', () => {
    forAllTagTypesIt('executes the correct transition on success', async () => {
      const resolvedPromise = Promise.resolve();
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(() => resolvedPromise)
            .onSuccess().transitionTo(tagFor('state2'))
            .onFailure().transitionTo(tagFor('state3'))
        .start();

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
    });

    forAllTagTypesIt('executes the correct transition on failure', async () => {
      const rejectedPromise = Promise.reject(new Error());
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(() => rejectedPromise)
            .onSuccess().transitionTo(tagFor('state2'))
            .onFailure().transitionTo(tagFor('state3'))
        .start();

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
    });

    forAllTagTypesIt('executes no transition when the state has been exited', async () => {
      const resolvedPromise = new Promise(resolve => setTimeout(resolve, 50));

      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(() => resolvedPromise).onSuccess().transitionTo(tagFor('state2'))
          .on(tagFor('event1')).transitionTo(tagFor('state3'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      await resolvedPromise;

      expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
    });

    forAllTagTypesIt('adds the result to the context object on success', async () => {
      const action = jasmine.createSpy('action');
      const resolvedPromise = Promise.resolve('result');
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(
            () => resolvedPromise
          ).onSuccess().transitionTo(tagFor('state2')).withAction(action)
        .start();

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(action).toHaveBeenCalledWith(
        tagFor('state1'), tagFor('state2'), { stateMachine, result: 'result' }
      );
    });

    forAllTagTypesIt('adds the error to the context object on failure', async () => {
      const action = jasmine.createSpy('action');
      const error = new Error('Boom!');
      const rejectedPromise = Promise.reject(error);
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(
            () => rejectedPromise
          ).onFailure().transitionTo(tagFor('state2')).withAction(action)
        .start();

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(action).toHaveBeenCalledWith(
        tagFor('state1'), tagFor('state2'), { stateMachine, error }
      );
    });

    forAllTagTypesIt('receives the correct parameters', async () => {
      const asyncOperation = jasmine.createSpy('asyncOperation').and.returnValue(Promise.resolve());
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .do(asyncOperation).onSuccess().transitionTo(tagFor('state2'))
        .start();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(asyncOperation).toHaveBeenCalledWith(tagFor('state1'), { stateMachine });
    });
  });

  describe('when defined for a non-initial state', () => {
    forAllTagTypesIt('executes the correct transition on success', async () => {
      const resolvedPromise = Promise.resolve();
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .on(tagFor('event1')).transitionTo(tagFor('state2'))
        .state(tagFor('state2'))
          .do(() => resolvedPromise)
            .onSuccess().transitionTo(tagFor('state3'))
            .onFailure().transitionTo(tagFor('state4'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
    });

    forAllTagTypesIt('executes the correct transition on failure', async () => {
      const rejectedPromise = Promise.reject(new Error());
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .on(tagFor('event1')).transitionTo(tagFor('state2'))
        .state(tagFor('state2'))
          .do(() => rejectedPromise)
            .onSuccess().transitionTo(tagFor('state3'))
            .onFailure().transitionTo(tagFor('state4'))
        .start();

      await stateMachine.handle(tagFor('event1'));

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe(tagFor('state4'));
    });

    forAllTagTypesIt('receives the correct parameters', async () => {
      const asyncOperation = jasmine.createSpy('asyncOperation').and.returnValue(Promise.resolve());
      const stateMachine = await Finity
        .configure()
        .initialState(tagFor('state1'))
          .on(tagFor('event1')).transitionTo(tagFor('state2'))
        .state(tagFor('state2'))
          .do(asyncOperation).onSuccess().transitionTo(tagFor('state3'))
        .start();

      await stateMachine.handle(tagFor('event1'), tagFor('payload1'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(asyncOperation).toHaveBeenCalledWith(tagFor('state2'), {
        stateMachine,
        event: tagFor('event1'),
        eventPayload: tagFor('payload1'),
      });
    });
  });
});

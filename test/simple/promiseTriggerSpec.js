import Finity from '../../src';

describe('promise trigger', () => {
  describe('when defined for the initial state', () => {
    it('executes the correct transition on success', async () => {
      const resolvedPromise = Promise.resolve();
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(() => resolvedPromise)
            .onSuccess().transitionTo('state2')
            .onFailure().transitionTo('state3')
        .start();

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe('state2');
    });

    it('executes the correct transition on failure', async () => {
      const rejectedPromise = Promise.reject(new Error());
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(() => rejectedPromise)
            .onSuccess().transitionTo('state2')
            .onFailure().transitionTo('state3')
        .start();

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe('state3');
    });

    it('executes no transition when the state has been exited', async () => {
      const resolvedPromise = new Promise(resolve => setTimeout(resolve, 50));

      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(() => resolvedPromise).onSuccess().transitionTo('state2')
          .on('event1').transitionTo('state3')
        .start();

      await stateMachine.handle('event1');

      await resolvedPromise;

      expect(stateMachine.getCurrentState()).toBe('state3');
    });

    it('adds the result to the context object on success', async () => {
      const action = jasmine.createSpy('action');
      const resolvedPromise = Promise.resolve('result');
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(
            () => resolvedPromise
          ).onSuccess().transitionTo('state2').withAction(action)
        .start();

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(action).toHaveBeenCalledWith(
        'state1', 'state2', { stateMachine, result: 'result' }
      );
    });

    it('adds the error to the context object on failure', async () => {
      const action = jasmine.createSpy('action');
      const error = new Error('Boom!');
      const rejectedPromise = Promise.reject(error);
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(
            () => rejectedPromise
          ).onFailure().transitionTo('state2').withAction(action)
        .start();

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(action).toHaveBeenCalledWith(
        'state1', 'state2', { stateMachine, error }
      );
    });

    it('receives the correct parameters', async () => {
      const asyncOperation = jasmine.createSpy('asyncOperation').and.returnValue(Promise.resolve());
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .do(asyncOperation).onSuccess().transitionTo('state2')
        .start();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(asyncOperation).toHaveBeenCalledWith('state1', { stateMachine });
    });
  });

  describe('when defined for a non-initial state', () => {
    it('executes the correct transition on success', async () => {
      const resolvedPromise = Promise.resolve();
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(() => resolvedPromise)
            .onSuccess().transitionTo('state3')
            .onFailure().transitionTo('state4')
        .start();

      await stateMachine.handle('event1');

      await resolvedPromise;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe('state3');
    });

    it('executes the correct transition on failure', async () => {
      const rejectedPromise = Promise.reject(new Error());
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(() => rejectedPromise)
            .onSuccess().transitionTo('state3')
            .onFailure().transitionTo('state4')
        .start();

      await stateMachine.handle('event1');

      await rejectedPromise.then(null, () => {});
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(stateMachine.getCurrentState()).toBe('state4');
    });

    it('receives the correct parameters', async () => {
      const asyncOperation = jasmine.createSpy('asyncOperation').and.returnValue(Promise.resolve());
      const stateMachine = await Finity
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(asyncOperation).onSuccess().transitionTo('state3')
        .start();

      await stateMachine.handle('event1', 'payload1');

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(asyncOperation).toHaveBeenCalledWith('state2', {
        stateMachine,
        event: 'event1',
        eventPayload: 'payload1',
      });
    });
  });
});

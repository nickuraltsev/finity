import StateMachine from '../src';

describe('async trigger', () => {
  describe('when defined for initial state', () => {
    it('executes transition on success', (done) => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(() => Promise.resolve())
            .onSuccess().transitionTo('state2')
            .onFailure().transitionTo('state3')
        .start();

      setTimeout(() => {
        expect(stateMachine.getCurrentState()).toBe('state2');
        done();
      }, 0);
    });

    it('executes transition on failure', (done) => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(() => Promise.reject(new Error()))
            .onSuccess().transitionTo('state2')
            .onFailure().transitionTo('state3')
        .start();

      setTimeout(() => {
        expect(stateMachine.getCurrentState()).toBe('state3');
        done();
      }, 0);
    });

    it('does not execute transition when state has been exited', (done) => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(() => Promise.resolve()).onSuccess().transitionTo('state2')
          .on('event1').transitionTo('state3')
        .start()
        .handle('event1');

      setTimeout(() => {
        expect(stateMachine.getCurrentState()).toBe('state3');
        done();
      }, 0);
    });

    it('puts result into context', (done) => {
      const action = jasmine.createSpy('action');
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(
            () => Promise.resolve('result')
          ).onSuccess().transitionTo('state2').withAction(action)
        .start();

      setTimeout(() => {
        expect(action).toHaveBeenCalledWith(
          'state1', 'state2', { stateMachine, result: 'result' }
        );
        done();
      }, 0);
    });

    it('puts error into context', (done) => {
      const action = jasmine.createSpy('action');
      const error = new Error('Boom!');
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(
            () => Promise.reject(error)
          ).onFailure().transitionTo('state2').withAction(action)
        .start();

      setTimeout(() => {
        expect(action).toHaveBeenCalledWith(
          'state1', 'state2', { stateMachine, error }
        );
        done();
      }, 0);
    });

    it('receives correct parameters', () => {
      const asyncAction = jasmine.createSpy('asyncAction').and.returnValue(Promise.resolve());
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .do(asyncAction).onSuccess().transitionTo('state2')
        .start();

      expect(asyncAction).toHaveBeenCalledWith('state1', { stateMachine });
    });
  });

  describe('when defined for non-initial state', () => {
    it('executes transition on success', (done) => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(() => Promise.resolve())
            .onSuccess().transitionTo('state3')
            .onFailure().transitionTo('state4')
        .start()
        .handle('event1');

      setTimeout(() => {
        expect(stateMachine.getCurrentState()).toBe('state3');
        done();
      }, 0);
    });

    it('executes transition on failure', (done) => {
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(() => Promise.reject(new Error()))
            .onSuccess().transitionTo('state3')
            .onFailure().transitionTo('state4')
        .start()
        .handle('event1');

      setTimeout(() => {
        expect(stateMachine.getCurrentState()).toBe('state4');
        done();
      }, 0);
    });

    it('receives correct parameters', () => {
      const asyncAction = jasmine.createSpy('asyncAction').and.returnValue(Promise.resolve());
      const stateMachine = StateMachine
        .configure()
        .initialState('state1')
          .on('event1').transitionTo('state2')
        .state('state2')
          .do(asyncAction).onSuccess().transitionTo('state3')
        .start()
        .handle('event1', 'payload1');

      expect(asyncAction).toHaveBeenCalledWith('state2', {
        stateMachine,
        event: 'event1',
        eventPayload: 'payload1'
      });
    });
  });
});

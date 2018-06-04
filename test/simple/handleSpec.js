import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';

describe('handle', () => {
  describe('when there are no transitions for the current state and event', () => {
    it('throws', async () => {
      let error;
      try {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
          .start();

        await stateMachine.handle('event1');
      } catch (e) {
        error = e;
      }

      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('Unhandled event \'event1\' in state \'state1\'.');
    });
  });

  describe('when there is a single transition for the current state and event', () => {
    describe('when the transition has a synchronous action', () => {
      it('transitions to the proper state after the action completes', async () => {
        let stateDuringTransition;
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withAction((from, to, context) => {
                stateDuringTransition = context.stateMachine.getCurrentState();
              })
          .start();

        await stateMachine.handle('event1');

        expect(stateDuringTransition).toBe('state1');
        expect(stateMachine.getCurrentState()).toBe('state2');
      });

      it('passes through the return value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withAction(() => 'action1')
          .start();

        expect(await stateMachine.handle('event1')).toBe('action1');
      });
    });

    describe('when the transition has an asynchronous action', () => {
      it('transitions to the proper state after the action completes', async () => {
        let stateDuringTransition;
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withAction(async (from, to, context) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                stateDuringTransition = context.stateMachine.getCurrentState();
              })
          .start();

        await stateMachine.handle('event1');

        expect(stateDuringTransition).toBe('state1');
        expect(stateMachine.getCurrentState()).toBe('state2');
      });

      it('passes through the return value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withAction(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'action1';
              })
          .start();

        expect(await stateMachine.handle('event1')).toBe('action1');
      });
    });

    describe('when the transition has no guard condition', () => {
      it('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state2');
      });

      it('returns undefined', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2')
          .start();

        expect(await stateMachine.handle('event1')).toBeUndefined();
      });
    });

    describe('when the guard condition of the transition is true', () => {
      it('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1').transitionTo('state2').withCondition(() => true)
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state2');
      });
    });

    describe('when the guard condition of the transition is false', () => {
      it('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .on('event1').transitionTo('state2').withCondition(() => false)
            .start();
          await stateMachine.handle('event1');
        } catch (e) {
          error = e;
        }

        expect(error instanceof Error).toBe(true);
        expect(error.message).toBe('Unhandled event \'event1\' in state \'state1\'.');
      });
    });
  });

  describe('when there are multiple transitions for the current state and event', () => {
    describe('when the first allowed transition has no guard condition', () => {
      it('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3')
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state3');
      });

      it('returns the proper value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2')
                .withCondition(() => false)
                .withAction(() => 'action1')
              .transitionTo('state3')
                .withAction(() => 'action2')
          .start();

        expect(await stateMachine.handle('event1')).toBe('action2');
      });
    });

    describe('when the first allowed transition has a guard transition', () => {
      it('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3').withCondition(() => true)
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state3');
      });
      it('returns the proper value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2')
                .withCondition(() => false)
                .withAction(() => 'action1')
              .transitionTo('state3')
                .withCondition(() => true)
                .withAction(() => 'action2')
          .start();

        expect(await stateMachine.handle('event1')).toBe('action2');
      });
    });

    describe('when there are multiple allowed transitions', () => {
      it('executes the first allowed transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2').withCondition(() => false)
              .transitionTo('state3').withCondition(() => true)
              .transitionTo('state4').withCondition(() => true)
              .transitionTo('state5')
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state3');
      });

      it('returns the value from the first allowed transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .on('event1')
              .transitionTo('state2')
                .withCondition(() => false)
                .withAction(() => 'action1')
              .transitionTo('state3')
                .withCondition(() => true)
                .withAction(() => 'action2')
              .transitionTo('state4')
                .withCondition(() => true)
                .withAction(() => 'action3')
              .transitionTo('state5')
                .withAction(() => 'action4')
          .start();

        expect(await stateMachine.handle('event1')).toBe('action2');
      });
    });

    describe('when there are no allowed transitions', () => {
      it('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .on('event1')
                .transitionTo('state2').withCondition(() => false)
                .transitionTo('state3').withCondition(() => false)
            .start();
          await stateMachine.handle('event1');
        } catch (e) {
          error = e;
        }

        expect(error instanceof Error).toBe(true);
        expect(error.message).toBe('Unhandled event \'event1\' in state \'state1\'.');
      });
    });
  });

  describe('when there is a single catch-all transition and no event-specific transitions', () => {
    describe('when the catch-all transition is allowed', () => {
      it('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState('state1')
            .onAny().transitionTo('state2')
          .start();

        await stateMachine.handle('event1');

        expect(stateMachine.getCurrentState()).toBe('state2');
      });
    });

    describe('when the catch-all transition is not allowed', () => {
      it('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .onAny().transitionTo('state2').withCondition(() => false)
            .start();
          await stateMachine.handle('event1');
        } catch (e) {
          error = e;
        }

        expect(error instanceof Error).toBe(true);
        expect(error.message).toBe('Unhandled event \'event1\' in state \'state1\'.');
      });
    });
  });

  describe(
    'when there is a single catch-all transition and a single event-specific transition',
    () => {
      describe('when both transitions are allowed', () => {
        it('executes the event-specific transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .onAny().transitionTo('state2')
              .on('event1').transitionTo('state3')
            .start();

          await stateMachine.handle('event1');

          expect(stateMachine.getCurrentState()).toBe('state3');
        });
      });

      describe('when only the catch-all transition is allowed', () => {
        it('executes the catch-all transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .on('event1').transitionTo('state2').withCondition(() => false)
              .onAny().transitionTo('state3')
            .start();

          await stateMachine.handle('event1');

          expect(stateMachine.getCurrentState()).toBe('state3');
        });
      });

      describe('when only the event-specific transition is allowed', () => {
        it('executes the event-specific transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState('state1')
              .onAny().transitionTo('state2').withCondition(() => false)
              .on('event1').transitionTo('state3')
            .start();

          await stateMachine.handle('event1');

          expect(stateMachine.getCurrentState()).toBe('state3');
        });
      });

      describe('when none of the transitions are allowed', () => {
        it('throws', async () => {
          let error;
          try {
            const stateMachine = await Finity
              .configure()
              .initialState('state1')
                .on('event1').transitionTo('state2').withCondition(() => false)
                .onAny().transitionTo('state3').withCondition(() => false)
              .start();
            await stateMachine.handle('event1');
          } catch (e) {
            error = e;
          }

          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('Unhandled event \'event1\' in state \'state1\'.');
        });
      });
    }
  );

  it('passes a context object to guard conditions', async () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = await Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start();

    await stateMachine.handle('event1');

    expect(condition).toHaveBeenCalledWith({ stateMachine, event: 'event1' });
  });

  it('adds the event payload to the context object', async () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = await Finity
      .configure()
      .initialState('state1')
        .on('event1').transitionTo('state2').withCondition(condition)
      .start();

    await stateMachine.handle('event1', 'payload1');

    expect(condition).toHaveBeenCalledWith({
      stateMachine,
      event: 'event1',
      eventPayload: 'payload1',
    });
  });

  it('calls onUnhandledEvent hooks', async () => {
    const unhandledEventHook = jasmine.createSpy('unhandledEventHook');

    const stateMachine = await Finity
      .configure()
      .global().onUnhandledEvent(unhandledEventHook)
      .initialState('state1')
      .start();

    await stateMachine.handle('event1');

    const context = { stateMachine, event: 'event1' };
    expect(unhandledEventHook).toHaveBeenCalledWith('event1', 'state1', context);
  });

  it('completes the processing of the current event before processing the next event', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .initialState('state1')
        .on('event1')
          .transitionTo('state2')
            .withAction(mocks.transitionAction)
        .onExit((...args) => {
          // send a new event in the middle of processing another event
          stateMachine.handle('event2');
          // this should be called before processing the new event
          mocks.stateExitAction(...args);
        })
      .state('state2')
        .onEnter(mocks.stateEntryAction)
        .on('event2')
          .transitionTo('state3')
            .withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state('state3')
        .onEnter(mocks.stateEntryAction)
      .start();

    mocks.reset();

    await stateMachine.handle('event1');

    expect(stateMachine.getCurrentState()).toBe('state3');

    const context1 = { stateMachine, event: 'event1' };
    const context2 = { stateMachine, event: 'event2' };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitAction', 'state1', context1],
      ['transitionAction', 'state1', 'state2', context1],
      ['stateEntryAction', 'state2', context1],
      ['stateExitAction', 'state2', context2],
      ['transitionAction', 'state2', 'state3', context2],
      ['stateEntryAction', 'state3', context2],
    ]);
  });
});

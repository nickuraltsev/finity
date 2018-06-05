import Finity from '../../src';
import HandlerMocks from '../support/HandlerMocks';
import { UnhandledEventError } from '../../src/core/Errors';

// eslint-disable-next-line no-unused-vars
import { tagFor, it, describe, beforeEach, afterEach, describeForAllTagTypes, forAllTagTypesIt } from '../support/forAllTagTypes';

describe('handle', () => {
  describe('when there are no transitions for the current state and event', () => {
    forAllTagTypesIt('throws', async () => {
      const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
      .start();

      let error;
      try {
        await stateMachine.handle(tagFor('event1'));
      } catch (e) {
        error = e;
      }

      expect(error instanceof UnhandledEventError).toBe(true);
      expect(error.event).toBe(tagFor('event1'));
      expect(error.state).toBe(tagFor('state1'));
    });
  });

  describe('when there is a single transition for the current state and event', () => {
    describe('when the transition has a synchronous action', () => {
      forAllTagTypesIt('transitions to the proper state after the action completes', async () => {
        let stateDuringTransition;
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withAction((from, to, context) => {
                stateDuringTransition = context.stateMachine.getCurrentState();
              })
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateDuringTransition).toBe(tagFor('state1'));
        expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
      });

      forAllTagTypesIt('passes through the return value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withAction(() => tagFor('action1'))
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action1'));
      });
    });

    describe('when the transition has an asynchronous action', () => {
      forAllTagTypesIt('transitions to the proper state after the action completes', async () => {
        let stateDuringTransition;
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withAction(async (from, to, context) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                stateDuringTransition = context.stateMachine.getCurrentState();
              })
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateDuringTransition).toBe(tagFor('state1'));
        expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
      });

      forAllTagTypesIt('passes through the return value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withAction(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return tagFor('action1');
              })
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action1'));
      });
    });

    describe('when the transition has no guard condition', () => {
      forAllTagTypesIt('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2'))
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
      });

      forAllTagTypesIt('returns undefined', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2'))
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBeUndefined();
      });
    });

    describe('when the guard condition of the transition is true', () => {
      forAllTagTypesIt('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => true)
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
      });
    });

    describe('when the guard condition of the transition is false', () => {
      forAllTagTypesIt('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => false)
            .start();
          await stateMachine.handle(tagFor('event1'));
        } catch (e) {
          error = e;
        }

        expect(error instanceof UnhandledEventError).toBe(true);
        expect(error.event).toBe(tagFor('event1'));
        expect(error.state).toBe(tagFor('state1'));
      });
    });
  });

  describe('when there are multiple transitions for the current state and event', () => {
    describe('when the first allowed transition has no guard condition', () => {
      forAllTagTypesIt('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3'))
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
      });

      forAllTagTypesIt('returns the proper value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2'))
                .withCondition(() => false)
                .withAction(() => tagFor('action1'))
              .transitionTo(tagFor('state3'))
                .withAction(() => tagFor('action2'))
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action2'));
      });
    });

    describe('when the first allowed transition has a guard transition', () => {
      forAllTagTypesIt('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3')).withCondition(() => true)
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
      });

      forAllTagTypesIt('returns the proper value', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2'))
                .withCondition(() => false)
                .withAction(() => tagFor('action1'))
              .transitionTo(tagFor('state3'))
                .withCondition(() => true)
                .withAction(() => tagFor('action2'))
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action2'));
      });
    });

    describe('when there are multiple allowed transitions', () => {
      forAllTagTypesIt('executes the first allowed transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2')).withCondition(() => false)
              .transitionTo(tagFor('state3')).withCondition(() => true)
              .transitionTo(tagFor('state4')).withCondition(() => true)
              .transitionTo(tagFor('state5'))
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
      });

      forAllTagTypesIt('returns the value from the first allowed transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .on(tagFor('event1'))
              .transitionTo(tagFor('state2'))
                .withCondition(() => false)
                .withAction(() => tagFor('action1'))
              .transitionTo(tagFor('state3'))
                .withCondition(() => true)
                .withAction(() => tagFor('action2'))
              .transitionTo(tagFor('state4'))
                .withCondition(() => true)
                .withAction(() => tagFor('action3'))
              .transitionTo(tagFor('state5'))
                .withAction(() => tagFor('action4'))
          .start();

        expect(await stateMachine.handle(tagFor('event1'))).toBe(tagFor('action2'));
      });
    });

    describe('when there are no allowed transitions', () => {
      forAllTagTypesIt('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .on(tagFor('event1'))
                .transitionTo(tagFor('state2')).withCondition(() => false)
                .transitionTo(tagFor('state3')).withCondition(() => false)
            .start();
          await stateMachine.handle(tagFor('event1'));
        } catch (e) {
          error = e;
        }

        expect(error instanceof UnhandledEventError).toBe(true);
        expect(error.event).toBe(tagFor('event1'));
        expect(error.state).toBe(tagFor('state1'));
      });
    });
  });

  describe('when there is a single catch-all transition and no event-specific transitions', () => {
    describe('when the catch-all transition is allowed', () => {
      forAllTagTypesIt('executes the transition', async () => {
        const stateMachine = await Finity
          .configure()
          .initialState(tagFor('state1'))
            .onAny().transitionTo(tagFor('state2'))
          .start();

        await stateMachine.handle(tagFor('event1'));

        expect(stateMachine.getCurrentState()).toBe(tagFor('state2'));
      });
    });

    describe('when the catch-all transition is not allowed', () => {
      forAllTagTypesIt('throws', async () => {
        let error;
        try {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .onAny().transitionTo(tagFor('state2')).withCondition(() => false)
            .start();
          await stateMachine.handle(tagFor('event1'));
        } catch (e) {
          error = e;
        }

        expect(error instanceof UnhandledEventError).toBe(true);
        expect(error.event).toBe(tagFor('event1'));
        expect(error.state).toBe(tagFor('state1'));
      });
    });
  });

  describe(
    'when there is a single catch-all transition and a single event-specific transition',
    () => {
      describe('when both transitions are allowed', () => {
        forAllTagTypesIt('executes the event-specific transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .onAny().transitionTo(tagFor('state2'))
              .on(tagFor('event1')).transitionTo(tagFor('state3'))
            .start();

          await stateMachine.handle(tagFor('event1'));

          expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
        });
      });

      describe('when only the catch-all transition is allowed', () => {
        forAllTagTypesIt('executes the catch-all transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => false)
              .onAny().transitionTo(tagFor('state3'))
            .start();

          await stateMachine.handle(tagFor('event1'));

          expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
        });
      });

      describe('when only the event-specific transition is allowed', () => {
        forAllTagTypesIt('executes the event-specific transition', async () => {
          const stateMachine = await Finity
            .configure()
            .initialState(tagFor('state1'))
              .onAny().transitionTo(tagFor('state2')).withCondition(() => false)
              .on(tagFor('event1')).transitionTo(tagFor('state3'))
            .start();

          await stateMachine.handle(tagFor('event1'));

          expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));
        });
      });

      describe('when none of the transitions are allowed', () => {
        forAllTagTypesIt('throws', async () => {
          let error;
          try {
            const stateMachine = await Finity
              .configure()
              .initialState(tagFor('state1'))
                .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(() => false)
                .onAny().transitionTo(tagFor('state3')).withCondition(() => false)
              .start();
            await stateMachine.handle(tagFor('event1'));
          } catch (e) {
            error = e;
          }

          expect(error instanceof UnhandledEventError).toBe(true);
          expect(error.event).toBe(tagFor('event1'));
          expect(error.state).toBe(tagFor('state1'));
        });
      });
    }
  );

  forAllTagTypesIt('passes a context object to guard conditions', async () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(condition)
      .start();

    await stateMachine.handle(tagFor('event1'));

    expect(condition).toHaveBeenCalledWith({ stateMachine, event: tagFor('event1') });
  });

  forAllTagTypesIt('adds the event payload to the context object', async () => {
    const condition = jasmine.createSpy('condition').and.returnValue(true);

    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
        .on(tagFor('event1')).transitionTo(tagFor('state2')).withCondition(condition)
      .start();

    await stateMachine.handle(tagFor('event1'), tagFor('payload1'));

    expect(condition).toHaveBeenCalledWith({
      stateMachine,
      event: tagFor('event1'),
      eventPayload: tagFor('payload1'),
    });
  });

  forAllTagTypesIt('calls onUnhandledEvent hooks', async () => {
    const unhandledEventHook = jasmine.createSpy('unhandledEventHook');

    const stateMachine = await Finity
      .configure()
      .global().onUnhandledEvent(unhandledEventHook)
      .initialState(tagFor('state1'))
      .start();

    await stateMachine.handle(tagFor('event1'));

    const context = { stateMachine, event: tagFor('event1') };
    expect(unhandledEventHook).toHaveBeenCalledWith(tagFor('event1'), tagFor('state1'), context);
  });

  forAllTagTypesIt('completes the processing of the current event before processing the next event', async () => {
    const mocks = new HandlerMocks();

    const stateMachine = await Finity
      .configure()
      .initialState(tagFor('state1'))
        .on(tagFor('event1'))
          .transitionTo(tagFor('state2'))
            .withAction(mocks.transitionAction)
        .onExit((...args) => {
          // send a new event in the mtagFor('le') of processing another event
          stateMachine.handle(tagFor('event2'));
          // this should be called before processing the new event
          mocks.stateExitAction(...args);
        })
      .state(tagFor('state2'))
        .onEnter(mocks.stateEntryAction)
        .on(tagFor('event2'))
          .transitionTo(tagFor('state3'))
            .withAction(mocks.transitionAction)
        .onExit(mocks.stateExitAction)
      .state(tagFor('state3'))
        .onEnter(mocks.stateEntryAction)
      .start();

    mocks.reset();

    await stateMachine.handle(tagFor('event1'));

    expect(stateMachine.getCurrentState()).toBe(tagFor('state3'));

    const context1 = { stateMachine, event: tagFor('event1') };
    const context2 = { stateMachine, event: tagFor('event2') };

    expect(mocks.calledHandlers).toEqual([
      ['stateExitAction', tagFor('state1'), context1],
      ['transitionAction', tagFor('state1'), tagFor('state2'), context1],
      ['stateEntryAction', tagFor('state2'), context1],
      ['stateExitAction', tagFor('state2'), context2],
      ['transitionAction', tagFor('state2'), tagFor('state3'), context2],
      ['stateEntryAction', tagFor('state3'), context2],
    ]);
  });
});

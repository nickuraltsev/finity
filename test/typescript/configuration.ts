import Finity, { Configuration, Context, StateMachine } from '../../';

enum State { S1, S2, S3, S4, S5, S6 }
enum Substate { S5A, S5B }
enum Event { E1, E2, E3, E4, E5, E6 }

(async ()=>{
  const config: Configuration<State, Event> =
    Finity
      .configure<State, Event>()
        .initialState(State.S1)
          .on(Event.E1).transitionTo(State.S2)
          .onEnter((state: State, context: Context<State, Event>) => {})
          .onExit((state: State, context: Context<State, Event>) => {})
        .state(State.S2)
          .on(Event.E1).ignore()
          .on(Event.E2).internalTransition()
          .on(Event.E3).selfTransition()
          .on(Event.E4)
            .transitionTo(State.S1)
              .withCondition((context: Context<State, Event>) => false)
              .withAction((fromState: State, toState: State, context: Context<State, Event>) => {})
            .transitionTo(State.S3)
          .onAny().transitionTo(State.S5)
        .state(State.S3)
          .do((state: State, context: Context<State, Event>) => Promise.resolve({ foo: 'bar' }))
            .onSuccess().transitionTo(State.S4)
            .onFailure().transitionTo(State.S5)
        .state(State.S4)
          .onTimeout(1000).transitionTo(State.S6)
        .state(State.S5)
          .submachine(
            Finity
              .configure<Substate, Event>()
                .initialState(Substate.S5A)
                  .on(Event.E5).transitionTo(Substate.S5B)
                .state(Substate.S5B)
                  .on(Event.E6).transitionTo(Substate.S5A)
              .getConfig()
          )
          .on(Event.E1).transitionTo(State.S2)
        .global()
          .onStateEnter((state: State, context: Context<State, Event>) => {})
          .onStateExit((state: State, context: Context<State, Event>) => {})
          .onTransition((fromState: State, toState: State, context: Context<State, Event>) => {})
          .onStateChange((fromState: State, toState: State, context: Context<State, Event>) => {})
          .onUnhandledEvent((event: Event, state: State, context: Context<State, Event>) => {})
      .getConfig();

  const stateMachine1: StateMachine<State, Event> = await Finity.start(config);

  const stateMachine2: StateMachine<string, string> =
    await Finity
      .configure()
        .initialState('state1')
      .start();
})();